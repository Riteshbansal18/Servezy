const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const MessageModel = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, index: true },
    senderId: { type: Schema.Types.ObjectId, index: true },
    text: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("messages", MessageModel);
