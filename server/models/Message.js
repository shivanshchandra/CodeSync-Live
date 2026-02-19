const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// fast queries: last messages in a room
messageSchema.index({ roomId: 1, createdAt: -1 });

// ✅ AUTO DELETE messages after 7 days
messageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 604800 } // 7 days
);

module.exports = mongoose.model("Message", messageSchema);
