require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

// Email transporter (GMAIL APP PASSWORD REQUIRED)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🔍 Verify email connection at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email config error:", error);
  } else {
    console.log("✅ Email server ready");
  }
});

// Handle quote form
app.post("/send-quote", async (req, res) => {
  console.log("Quote received:", req.body);

  const {
    name,
    email,
    phone,
    service,
    date,
    time,
    vehicleDetails
  } = req.body;

  const mailOptions = {
    from: `"Elite Detailz" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // YOUR inbox
    subject: "🚗 New Quote Request",
    html: `
      <h2>New Quote Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Vehicle:</strong> ${vehicleDetails}</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Email failed:", error);
    res.status(500).json({ success: false, error: "Email failed" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
