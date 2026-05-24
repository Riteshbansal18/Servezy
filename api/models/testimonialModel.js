const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const TestimonialModel = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, index: true },
    serviceId: { type: Schema.Types.ObjectId, index: true },
    text: String,
    rating: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("testimonials", TestimonialModel);
