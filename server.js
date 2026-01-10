import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================
   Middleware
======================= */

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://elitedetailzz.github.io"
    ],
    methods: ["POST", "GET"],
    allowedHeaders: ["Content-Type"]
  })
);

/* =======================
   Health Check
======================= */
app.get("/", (req, res) => {
  res.send("Elite Detailz backend is running 🚗✨");
});

/* =======================
   Email Transport
======================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* Verify email connection on startup */
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email transporter error:", err);
  } else {
    console.log("✅ Email transporter ready");
  }
});

/* =======================
   Send Quote Route
======================= */
app.post("/send-quote", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      service,
      date,
      time,
      vehicleDetails
    } = req.body;

    console.log("📩 Quote received:", req.body);

    const mailOptions = {
      from: `"Elite Detailz" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: "🚗 New Quote Request",
      html: `
        <h2>New Quote Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Vehicle Details:</strong><br>${vehicleDetails}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully");

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Email send failed:", error);

    res.status(500).json({
      success: false,
      error: "Email failed to send"
    });
  }
});

/* =======================
   Start Server
======================= */
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
