const router = require("express").Router();
const auth = require("../middlewares/auth");
const Room = require("../models/Room");
const RoomActivity = require("../models/RoomActivity");

// GET /api/rooms/:roomId  (metadata)
router.get("/:roomId", auth, async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findOne({ roomId }).populate("createdBy", "name email");
  if (!room) return res.status(404).json({ message: "Room not found" });
  res.json(room);
});

// GET /api/rooms/:roomId/activity?limit=50 (join/leave logs)
router.get("/:roomId/activity", auth, async (req, res) => {
  const { roomId } = req.params;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const logs = await RoomActivity.find({ roomId })
    .sort({ at: -1 })
    .limit(limit);
  res.json(logs.reverse()); // oldest -> newest
});

module.exports = router;
