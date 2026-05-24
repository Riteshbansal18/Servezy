const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Graphic Design",
  "Writing & Translation",
  "Digital Marketing",
  "Video & Animation",
  "Data & Analytics",
  "Other",
];

const ServiceModel = new Schema(
  {
    title: String,
    description: String,
    price: Number,
    images: String,
    userId: { type: Schema.Types.ObjectId, index: true },
    category: {
      type: String,
      enum: CATEGORIES,
      default: "Other",
      index: true,
    },
    deliveryTime: {
      type: Number, // days
      default: 7,
      min: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("services", ServiceModel);
module.exports.CATEGORIES = CATEGORIES;
