const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const ChatModel = new Schema(
  {
    between: { type: [Schema.Types.ObjectId], index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("chats", ChatModel);
