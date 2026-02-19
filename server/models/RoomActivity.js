const mongoose = require("mongoose");

const roomActivitySchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    action: { type: String, enum: ["JOIN", "LEAVE"], required: true },
    at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomActivity", roomActivitySchema);
