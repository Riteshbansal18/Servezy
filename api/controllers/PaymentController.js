const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/orderModel");
const { findServiceById } = require("./ServicesController");
const { findUserById } = require("./UserController");
const { sendMessage } = require("./ChatController");
const { sendOrderNotificationEmail } = require("../config/mailer");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1 — Create Razorpay order (called before showing payment popup)
const createPaymentOrder = async (clientId, serviceId) => {
  const client = await findUserById(clientId);
  if (!client) return "User Doesn't Exists";
  if (client.role !== "client") return "You Don't Have Permission";

  const service = await findServiceById(serviceId);
  if (!service) return "Service Doesn't Exists";

  // Check for existing unpaid/ongoing order
  const existing = await Order.findOne({
    clientId: client._id,
    serviceId: service._id,
    status: "OnGoing",
  });
  if (existing) return "You Already Have A Uncompleted Order For This Service";

  // Amount in paise (1 USD = ~83 INR, price is in USD)
  const amountInPaise = Math.round(service.price * 83 * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `receipt_${clientId}_${serviceId}_${Date.now()}`,
    notes: {
      serviceId: serviceId.toString(),
      clientId: clientId.toString(),
      serviceTitle: service.title,
    },
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    serviceTitle: service.title,
    servicePrice: service.price,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

// Step 2 — Verify payment signature & create order in DB
const verifyAndCreateOrder = async (clientId, serviceId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const client = await findUserById(clientId);
  if (!client) return "User Doesn't Exists";
  if (client.role !== "client") return "You Don't Have Permission";

  const service = await findServiceById(serviceId);
  if (!service) return "Service Doesn't Exists";

  // Verify signature
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return "Payment Verification Failed";
  }

  // Create order in DB with payment info
  const text = `Hello, I would like to order ${service.title} service`;
  await sendMessage(clientId, service.userId, text);

  await Order.create({
    clientId: client._id,
    serviceId: service._id,
    status: "OnGoing",
    paymentStatus: "paid",
    razorpayOrderId,
    razorpayPaymentId,
  });

  // Email notification to freelancer
  try {
    const freelancer = await findUserById(service.userId);
    if (freelancer && freelancer.email) {
      await sendOrderNotificationEmail(
        freelancer.email,
        freelancer.fullName || freelancer.username,
        client.fullName || client.username,
        service.title
      );
    }
  } catch (err) {
    console.log("Payment order email failed:", err.message);
  }

  return "Order Made Successfully";
};

module.exports = { createPaymentOrder, verifyAndCreateOrder };
