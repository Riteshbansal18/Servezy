const express = require("express");
const route = express.Router();
const VerifyToken = require("../middleware/Auth");
const {
  registerUser,
  findUserById,
  updateUser,
  loginUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} = require("../controllers/UserController");
const {
  createProfileUploadImage,
  updateProfileUploadImage,
} = require("../middleware/uploadImage");
const { sendContactEmail } = require("../config/mailer");

route.post("/register", createProfileUploadImage, async (req, res) => {
  const image = req.file && req.file.filename;
  const { fullName, age, email, username, password, role } = req.body;
  try {
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 60) {
      return res.json({ msg: "Age must be between 18 and 60", status: 400 });
    }
    const createdUser = await registerUser(
      fullName,
      age,
      email,
      username,
      password,
      image,
      role
    );
    if (createdUser) {
      return res.json({ msg: "User Created Successfully", status: 200 });
    }
    return res.json({ msg: "Username Or Email Already Exists", status: 403 });
  } catch (err) {
    return res.json({ msg: "Error Occured: " + err.message, status: 505 });
  }
});

route.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const authentifiedUser = await loginUser(username, password);
    if (authentifiedUser) {
      if (authentifiedUser == 1) {
        return res.json({ msg: "Wrong Credentials", status: 401 });
      } else if (authentifiedUser == 2) {
        return res.json({ msg: "Please verify your email before logging in", status: 403 });
      } else {
        const { password, otp, otpExpiry, ...safeUser } = authentifiedUser.user.toObject();
        return res.json({
          msg: "Logged Successfully",
          token: authentifiedUser.token,
          userInfo: safeUser,
          status: 200,
        });
      }
    }
    return res.json({ msg: "User Doesn't Exists", status: 404 });
  } catch (err) {
    return res.json({ msg: "Error Occured: " + err.message, status: 505 });
  }
});

route.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOtp(email, otp);
    return res.json(result);
  } catch (err) {
    return res.json({ msg: "Error Occured: " + err.message, status: 505 });
  }
});

route.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await resendOtp(email);
    return res.json(result);
  } catch (err) {
    return res.json({ msg: "Error Occured: " + err.message, status: 505 });
  }
});

route.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotPassword(email);
    return res.json(result);
  } catch (err) {
    return res.json({ msg: "Error Occured: " + err.message, status: 505 });
  }
});

route.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await resetPassword(email, otp, newPassword);
    return res.json(result);
  } catch (err) {
    return res.json({ msg: "Error Occured: " + err.message, status: 505 });
  }
});

route.put(
  "/update",
  VerifyToken,
  updateProfileUploadImage,
  async (req, res) => {
    const imageFile = req.file && req.file.filename;
    const { fullName, age, username, image } = req.body;
    const updatedUser = await updateUser(
      req.userId,
      fullName,
      age,
      username,
      image,
      imageFile
    );
    const updatedUserInfo = await findUserById(req.userId);
    const { password, otp, otpExpiry, ...safeUpdatedUser } = updatedUserInfo.toObject();
    try {
      if (updatedUser) {
        return res.json({
          msg: "User Updated Successfully",
          updatedUserInfo: safeUpdatedUser,
          status: 200,
        });
      } else {
        return res.json({ msg: "User Doesn't Exists", status: 404 });
      }
    } catch (err) {
      return res.json({ msg: "Error Occured: " + err.message, status: 505 });
    }
  }
);

route.post("/contact", async (req, res) => {
  try {
    const { fullName, email, message } = req.body;
    if (!fullName || !email || !message) {
      return res.json({ msg: "All fields are required", status: 400 });
    }
    await sendContactEmail(fullName, email, message);
    return res.json({ msg: "Message sent successfully", status: 200 });
  } catch (err) {
    return res.json({ msg: "Error Occured: " + err.message, status: 505 });
  }
});

module.exports = route;
