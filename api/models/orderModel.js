const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const OrderModel = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, index: true },
    serviceId: { type: Schema.Types.ObjectId, index: true },
    status: { type: String, default: "OnGoing", index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("orders", OrderModel);
