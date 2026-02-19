import React, { useEffect, useRef, useState, useContext } from "react";
import Client from "./Client";
import Editor from "./Editor";
import Chat from "./Chat";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const LANGUAGES = [
  "python3","java","cpp","nodejs","c","ruby","go","scala","bash","sql",
  "pascal","csharp","php","swift","rust","r",
];

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("python3");

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // ✅ count

  const codeRef = useRef(null);
  const socketRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const { user, loading } = useContext(AuthContext);
  const username = user?.name || user?.email;

  useEffect(() => {
    const init = async () => {
      if (loading) return;

      if (!username) {
        toast.error("Please login again");
        navigate("/login");
        return;
      }

      socketRef.current = await initSocket();

      const handleErrors = (err) => {
        console.log("Socket Error", err);
        toast.error("Socket connection failed, try again later");
        navigate("/");
      };

      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      socketRef.current.emit(ACTIONS.JOIN, { roomId, username });

      socketRef.current.on(ACTIONS.JOINED, ({ clients, username: joinedUser, socketId }) => {
        if (joinedUser !== username) toast.success(`${joinedUser} joined the room.`);
        setClients(clients);

        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        });
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username: leftUser }) => {
        toast.success(`${leftUser} left the room`);
        setClients((prev) => prev.filter((c) => c.socketId !== socketId));
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, [loading, username, roomId, navigate]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID is copied");
    } catch (error) {
      console.log(error);
      toast.error("Unable to copy the room ID");
    }
  };

  const leaveRoom = () => navigate("/");

  const runCode = async () => {
    setIsCompiling(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/compile`, {
        code: codeRef.current,
        language: selectedLanguage,
      });
      setOutput(response.data.output || JSON.stringify(response.data));
    } catch (error) {
      console.error("Error compiling code:", error);
      setOutput(error.response?.data?.error || "An error occurred");
    } finally {
      setIsCompiling(false);
    }
  };

  const toggleCompileWindow = () => setIsCompileWindowOpen((p) => !p);

  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      <div className="row flex-grow-1">
        <div className="col-md-2 bg-dark text-light d-flex flex-column">
          <div className="text-center pt-3">
            <img
              src="/images/codecast.svg"
              alt="CodeSync Live"
              style={{ height: "80px", width: "auto" }}
            />
            <hr className="text-secondary mt-0 mb-3" />
          </div>

          <div className="px-2 pb-2 d-flex align-items-center gap-2">
            <small className="text-secondary m-0">You:</small>
            <span className="fw-bold">{username || "..."}</span>
          </div>

          <div className="d-flex flex-column flex-grow-1 overflow-auto px-2">
            <span className="mb-2">Members</span>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>

          <hr />
          <div className="mt-auto mb-3 px-2">
            <button className="btn btn-success w-100 mb-2" onClick={copyRoomId}>
              Copy Room ID
            </button>
            <button className="btn btn-danger w-100" onClick={leaveRoom}>
              Leave Room
            </button>
          </div>
        </div>

        <div className="col-md-10 text-light d-flex flex-column">
          <div className="bg-dark p-2 d-flex justify-content-end align-items-center gap-2">
            {/* Chat pill button with unread count */}
            <button
              className="cs-chat-btn position-relative"
              onClick={() => {
                setIsChatOpen(true);
                setUnreadCount(0);
              }}
              type="button"
              title="Open Chat"
            >
              <span className="cs-chat-btn-icon" aria-hidden="true">💬</span>
              <span className="cs-chat-btn-text">Chat</span>
              {unreadCount > 0 && (
                <span className="cs-unread-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </button>

            <button
              className="btn btn-primary"
              onClick={toggleCompileWindow}
              type="button"
              title={isCompileWindowOpen ? "Close Compiler" : "Open Compiler"}
            >
              {isCompileWindowOpen ? "Close Compiler" : "Open Compiler"}
            </button>

            <select
              className="form-select w-auto"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
          />
        </div>
      </div>

      <Chat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        socketRef={socketRef}
        roomId={roomId}
        me={user}
        onIncomingWhileClosed={() => setUnreadCount((c) => c + 1)}
      />

      <div
        className={`bg-dark text-light p-3 ${isCompileWindowOpen ? "d-block" : "d-none"}`}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: isCompileWindowOpen ? "30vh" : "0",
          transition: "height 0.3s ease-in-out",
          overflowY: "auto",
          zIndex: 1040,
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">Compiler Output ({selectedLanguage})</h5>
          <div>
            <button className="btn btn-success me-2" onClick={runCode} disabled={isCompiling}>
              {isCompiling ? "Compiling..." : "Run Code"}
            </button>
            <button className="btn btn-secondary" onClick={toggleCompileWindow}>
              Close
            </button>
          </div>
        </div>
        <pre className="bg-secondary p-3 rounded">
          {output || "Output will appear here after compilation"}
        </pre>
      </div>
    </div>
  );
}

export default EditorPage;
