const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const UserModel = new Schema(
  {
    fullName: String,
    age: Number,
    email: { type: String, unique: true, index: true },
    username: { type: String, unique: true, index: true },
    password: String,
    role: { type: String, index: true },
    image: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("users", UserModel);
