require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Servezy" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Email Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p style="color: #555;">Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #feab5e; text-align: center; padding: 16px 0;">
          ${otp}
        </div>
        <p style="color: #999; font-size: 12px;">If you did not create an account, ignore this email.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendOrderNotificationEmail = async (freelancerEmail, freelancerName, clientName, serviceTitle) => {
  const mailOptions = {
    from: `"Servezy" <${process.env.EMAIL_USER}>`,
    to: freelancerEmail,
    subject: `New Order Received — ${serviceTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #feab5e;">New Order 🎉</h2>
        <p style="color: #555;">Hi <strong>${freelancerName}</strong>,</p>
        <p style="color: #555;"><strong>${clientName}</strong> has placed an order for your service:</p>
        <div style="background: #fff8f0; border-left: 4px solid #feab5e; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <strong style="font-size: 18px;">${serviceTitle}</strong>
        </div>
        <p style="color: #555;">Log in to your dashboard to view the order details and start a conversation.</p>
        <p style="color: #999; font-size: 12px;">— The Servezy Team</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendContactEmail = async (senderName, senderEmail, messageText) => {
  const mailOptions = {
    from: `"Servezy Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `Contact Form — ${senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #feab5e;">New Contact Message</h2>
        <p><strong>Name:</strong> ${senderName}</p>
        <p><strong>Email:</strong> ${senderEmail}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f9f9f9; padding: 12px 16px; border-radius: 4px; color: #333;">
          ${messageText}
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendOrderCompletedEmail = async (clientEmail, clientName, freelancerName, serviceTitle) => {
  const mailOptions = {
    from: `"Servezy" <${process.env.EMAIL_USER}>`,
    to: clientEmail,
    subject: `Your Order is Completed — ${serviceTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #feab5e;">Order Completed ✅</h2>
        <p style="color: #555;">Hi <strong>${clientName}</strong>,</p>
        <p style="color: #555;">Great news! <strong>${freelancerName}</strong> has completed your order:</p>
        <div style="background: #fff8f0; border-left: 4px solid #feab5e; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <strong style="font-size: 18px;">${serviceTitle}</strong>
        </div>
        <p style="color: #555;">Log in to your dashboard to review the work and leave a testimonial.</p>
        <p style="color: #999; font-size: 12px;">— The Servezy Team</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendOrderCancelledEmail = async (freelancerEmail, freelancerName, clientName, serviceTitle) => {
  const mailOptions = {
    from: `"Servezy" <${process.env.EMAIL_USER}>`,
    to: freelancerEmail,
    subject: `Order Cancelled — ${serviceTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #e74c3c;">Order Cancelled ❌</h2>
        <p style="color: #555;">Hi <strong>${freelancerName}</strong>,</p>
        <p style="color: #555;"><strong>${clientName}</strong> has cancelled their order for your service:</p>
        <div style="background: #fff5f5; border-left: 4px solid #e74c3c; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <strong style="font-size: 18px;">${serviceTitle}</strong>
        </div>
        <p style="color: #555;">You can check your dashboard for other active orders.</p>
        <p style="color: #999; font-size: 12px;">— The Servezy Team</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendOrderNotificationEmail, sendOrderCompletedEmail, sendOrderCancelledEmail, sendContactEmail };
