const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middlewares/auth");

// GET /api/messages/:roomId?limit=50
router.get("/:roomId", auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);

    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // return oldest -> newest for UI
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: "Failed to load messages" });
  }
});

module.exports = router;
