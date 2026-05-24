require("dotenv").config();
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { existsSync, unlinkSync } = require("fs");
const { sendOtpEmail } = require("../config/mailer");
const Service = require("../models/serviceModel");
const Order = require("../models/orderModel");
const Testimonial = require("../models/testimonialModel");

// Generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const userExists = async (email) => {
  const selectedUser = await User.findOne({ email });
  return selectedUser;
};

const findUsers = async () => {
  const allUsers = await User.find();
  return allUsers;
};

const findUserById = async (id) => {
  const selectedUser = await User.findById(id);
  if (selectedUser) return selectedUser;
  else return null;
};

const registerUser = async (fullName, age, email, username, password, image, role) => {
  const allUsers = await findUsers();
  const exists = allUsers.find((e) => e.email == email || e.username == username);
  if (exists) return null;

  const salt = await bcrypt.genSalt(10);
  const newPassword = await bcrypt.hash(password, salt);
  const newImage = image ? image : "no-image.png";
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const createdUser = await User.create({
    fullName, age, email, username,
    password: newPassword, role,
    image: newImage, otp, otpExpiry,
    isVerified: false,
  });

  await sendOtpEmail(email, otp);
  return createdUser;
};

const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ email });
  if (!user) return { success: false, msg: "User not found", status: 404 };
  if (user.isVerified) return { success: true, msg: "Already verified", status: 200 };
  if (!user.otp || !user.otpExpiry) return { success: false, msg: "OTP not found", status: 400 };
  if (new Date() > user.otpExpiry) return { success: false, msg: "OTP expired", status: 400 };
  if (user.otp !== otp) return { success: false, msg: "Invalid OTP", status: 400 };

  await User.updateOne({ email }, { isVerified: true, otp: null, otpExpiry: null });
  return { success: true, msg: "Email verified successfully", status: 200 };
};

const resendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return { success: false, msg: "User not found", status: 404 };
  if (user.isVerified) return { success: false, msg: "Email already verified", status: 400 };

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await User.updateOne({ email }, { otp, otpExpiry });
  await sendOtpEmail(email, otp);
  return { success: true, msg: "OTP resent successfully", status: 200 };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return { success: false, msg: "No account found with this email", status: 404 };

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await User.updateOne({ email }, { otp, otpExpiry });
  await sendOtpEmail(email, otp);
  return { success: true, msg: "OTP sent to your email", status: 200 };
};

const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email });
  if (!user) return { success: false, msg: "User not found", status: 404 };
  if (!user.otp || !user.otpExpiry) return { success: false, msg: "OTP not found, request a new one", status: 400 };
  if (new Date() > user.otpExpiry) return { success: false, msg: "OTP expired", status: 400 };
  if (user.otp !== otp) return { success: false, msg: "Invalid OTP", status: 400 };

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  await User.updateOne({ email }, { password: hashedPassword, otp: null, otpExpiry: null });
  return { success: true, msg: "Password reset successfully", status: 200 };
};

const loginUser = async (username, password) => {
  const allUsers = await findUsers();
  const userExists = allUsers.find((e) => e.username == username);
  if (userExists) {
    if (!userExists.isVerified) return 2; // not verified
    const result = await bcrypt.compare(password, userExists.password);
    if (result) {
      const token = jwt.sign({ userId: userExists._id }, process.env.SECRET, { expiresIn: "7d" });
      return { token, user: userExists };
    }
    return 1;
  }
  return null;
};

const getPublicFreelancersList = async () => {
  const freelancers = await User.find({ role: "freelancer", isVerified: true }).select(
    "-password -otp -otpExpiry -email"
  );

  const result = [];
  for (let f of freelancers) {
    const services = await Service.find({ userId: f._id });
    let totalRating = 0;
    let ratedCount = 0;
    for (let s of services) {
      const testimonials = await Testimonial.find({ serviceId: s._id });
      if (testimonials.length > 0) {
        const sum = testimonials.reduce((acc, t) => acc + parseInt(t.rating), 0);
        totalRating += sum / testimonials.length;
        ratedCount++;
      }
    }
    const overallRating =
      ratedCount > 0 ? parseFloat((totalRating / ratedCount).toFixed(1)) : 0;

    result.push({
      _id: f._id,
      fullName: f.fullName,
      username: f.username,
      image: f.image,
      totalServices: services.length,
      overallRating,
    });
  }
  return result;
};

const getFreelancerPublicProfile = async (username) => {
  const user = await User.findOne({ username });
  if (!user) return "User Not Found";
  if (user.role !== "freelancer") return "Not A Freelancer";

  const services = await Service.find({ userId: user._id }).sort({ updatedAt: -1 });

  let servicesWithRatings = [];
  let totalRating = 0;
  let ratedCount = 0;

  for (let service of services) {
    const testimonials = await Testimonial.find({ serviceId: service._id })
      .sort({ createdAt: -1 })
      .limit(5);

    let avgRating = 0;
    if (testimonials.length > 0) {
      const sum = testimonials.reduce((acc, t) => acc + parseInt(t.rating), 0);
      avgRating = parseFloat((sum / testimonials.length).toFixed(1));
      totalRating += avgRating;
      ratedCount++;
    }

    // Fetch reviewer names for testimonials
    const testimonialsWithNames = await Promise.all(
      testimonials.map(async (t) => {
        const reviewer = await User.findById(t.clientId).select("username image");
        return {
          _id: t._id,
          text: t.text,
          rating: t.rating,
          createdAt: t.createdAt,
          reviewer: reviewer
            ? { username: reviewer.username, image: reviewer.image }
            : { username: "Anonymous", image: "no-image.png" },
        };
      })
    );

    servicesWithRatings.push({
      _id: service._id,
      title: service.title,
      description: service.description,
      price: service.price,
      images: service.images,
      category: service.category,
      deliveryTime: service.deliveryTime,
      createdAt: service.createdAt,
      serviceRating: avgRating,
      testimonials: testimonialsWithNames,
    });
  }

  const overallRating =
    ratedCount > 0 ? parseFloat((totalRating / ratedCount).toFixed(1)) : 0;

  const { password, otp, otpExpiry, email, ...safeUser } = user.toObject();

  // Completed orders count
  const allUserServices = await Service.find({ userId: user._id });
  const serviceIds = allUserServices.map(s => s._id);
  const completedOrders = await Order.countDocuments({
    serviceId: { $in: serviceIds },
    status: "Completed",
  });

  return {
    user: safeUser,
    services: servicesWithRatings,
    overallRating,
    totalServices: services.length,
    completedOrders,
    memberSince: user.createdAt,
  };
};

const updateUser = async (userId, fullName, age, username, image, imageFile) => {
  const selectedUser = await findUserById(userId);
  if (selectedUser) {
    let newImage;
    if (image == undefined && imageFile == undefined) {
      image = selectedUser.image;
    } else if (image == "no-image.png" && imageFile == undefined) {
      if (existsSync(`./uploads/Users_imgs/${selectedUser.image}`)) {
        unlinkSync(`./uploads/Users_imgs/${selectedUser.image}`);
      }
      newImage = "no-image.png";
    } else if (image == null && imageFile != null) {
      if (existsSync(`./uploads/Users_imgs/${selectedUser.image}`)) {
        unlinkSync(`./uploads/Users_imgs/${selectedUser.image}`);
      }
      newImage = imageFile;
    }
    const updatedUser = await User.updateOne(
      { _id: selectedUser._id },
      { fullName, age, username, image: newImage }
    );
    return updatedUser;
  }
  return null;
};

module.exports = {
  userExists,
  findUserById,
  findUsers,
  registerUser,
  loginUser,
  updateUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getFreelancerPublicProfile,
  getPublicFreelancersList,
};
