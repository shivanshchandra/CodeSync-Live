require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const ACTIONS = require("./Actions");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const jwt = require("jsonwebtoken");
const User = require("./models/User");

const messageRoutes = require("./routes/messages");
const Message = require("./models/Message");

const roomRoutes = require("./routes/rooms");
const Room = require("./models/Room");
const RoomActivity = require("./models/RoomActivity");

const app = express();
const server = http.createServer(app);

const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  cpp17: { versionIndex: "0" },
  nodejs: { versionIndex: "3" },
  c: { versionIndex: "4" },
  ruby: { versionIndex: "3" },
  go: { versionIndex: "3" },
  scala: { versionIndex: "3" },
  bash: { versionIndex: "3" },
  sql: { versionIndex: "3" },
  pascal: { versionIndex: "2" },
  csharp: { versionIndex: "3" },
  php: { versionIndex: "3" },
  swift: { versionIndex: "3" },
  rust: { versionIndex: "3" },
  r: { versionIndex: "3" },
};

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Server running" });
});

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {}; // socketId -> username

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
    socketId,
    username: userSocketMap[socketId],
  }));
};

// roomId -> Set(userId as string) for users who currently have chat open
const chatOpenUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id name email");
    if (!user) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch (e) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on(ACTIONS.JOIN, async ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    // ✅ Room metadata + members + activity log
    try {
      const userId = socket.user._id;
      const displayName = socket.user.name || socket.user.email;

      let room = await Room.findOne({ roomId });
      if (!room) {
        room = await Room.create({
          roomId,
          createdBy: userId,
          members: [userId],
          lastActiveAt: new Date(),
        });
      } else {
        await Room.updateOne(
          { roomId },
          {
            $addToSet: { members: userId },
            $set: { lastActiveAt: new Date() },
          }
        );
      }

      await RoomActivity.create({
        roomId,
        user: userId,
        username: displayName,
        action: "JOIN",
      });
    } catch (err) {
      console.error("Room JOIN log error:", err.message);
    }

    const clients = getAllConnectedClients(roomId);

    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // ✅ Typing indicator
  socket.on(ACTIONS.TYPING, ({ roomId }) => {
    const name = socket.user.name || socket.user.email;
    socket.in(roomId).emit(ACTIONS.USER_TYPING, { roomId, userId: String(socket.user._id), name, isTyping: true });
  });

  socket.on(ACTIONS.STOP_TYPING, ({ roomId }) => {
    const name = socket.user.name || socket.user.email;
    socket.in(roomId).emit(ACTIONS.USER_TYPING, { roomId, userId: String(socket.user._id), name, isTyping: false });
  });

  // ✅ Read receipt (light): track who has chat open
  socket.on(ACTIONS.CHAT_OPEN, ({ roomId }) => {
    const key = roomId;
    if (!chatOpenUsers.has(key)) chatOpenUsers.set(key, new Set());
    chatOpenUsers.get(key).add(String(socket.user._id));
  });

  socket.on(ACTIONS.CHAT_CLOSE, ({ roomId }) => {
    const key = roomId;
    const set = chatOpenUsers.get(key);
    if (!set) return;
    set.delete(String(socket.user._id));
    if (set.size === 0) chatOpenUsers.delete(key);
  });

  // ✅ CHAT: save + broadcast (+ clientId for optimistic replace) + light read receipts
  socket.on(ACTIONS.SEND_MESSAGE, async ({ roomId, text, clientId }) => {
    try {
      if (!roomId || !text || !text.trim()) return;

      await Room.updateOne({ roomId }, { $set: { lastActiveAt: new Date() } }).catch(() => {});

      const saved = await Message.create({
        roomId,
        sender: socket.user._id,
        senderName: socket.user.name || socket.user.email,
        text: text.trim(),
      });

      const payload = {
        _id: saved._id,
        clientId: clientId || null,
        roomId,
        sender: socket.user._id,
        senderName: saved.senderName,
        text: saved.text,
        createdAt: saved.createdAt,
      };

      io.to(roomId).emit(ACTIONS.RECEIVE_MESSAGE, payload);

      // light "Seen": if any OTHER user has chat open in this room
      const openSet = chatOpenUsers.get(roomId);
      const senderId = String(socket.user._id);
      const seenByOthers = openSet ? Array.from(openSet).some((id) => id !== senderId) : false;

      if (seenByOthers) {
        io.to(roomId).emit(ACTIONS.MESSAGE_SEEN, {
          roomId,
          messageId: String(saved._id),
          seen: true,
        });
      }
    } catch (err) {
      console.error("SEND_MESSAGE error:", err.message);
    }
  });

  socket.on("disconnecting", async () => {
    const rooms = [...socket.rooms];

    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    // ✅ activity + room member cleanup + chatOpen cleanup
    try {
      const displayName = socket.user.name || socket.user.email;

      for (const roomId of rooms) {
        if (roomId === socket.id) continue;

        await RoomActivity.create({
          roomId,
          user: socket.user._id,
          username: displayName,
          action: "LEAVE",
        });

        await Room.updateOne(
          { roomId },
          { $pull: { members: socket.user._id }, $set: { lastActiveAt: new Date() } }
        ).catch(() => {});

        const set = chatOpenUsers.get(roomId);
        if (set) {
          set.delete(String(socket.user._id));
          if (set.size === 0) chatOpenUsers.delete(roomId);
        }
      }
    } catch (err) {
      console.error("disconnect log error:", err.message);
    }

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

app.post("/compile", async (req, res) => {
  const { code, language, input } = req.body; // ✅ take input also

  const config = languageConfig[language];
  if (!config) return res.status(400).json({ error: "Language not supported" });

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language,
      versionIndex: config.versionIndex,
      stdin: input || "",                 // ✅ send stdin to JDoodle
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
    });

    res.json({
      output: response.data.output,
      memory: response.data.memory,
      cpuTime: response.data.cpuTime,
      statusCode: response.data.statusCode,
    });
  } catch (error) {
    console.error("Compilation error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to compile code",
      details: error.response?.data || error.message,
    });
  }
});


const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
};
start();
