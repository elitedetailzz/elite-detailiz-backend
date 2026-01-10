import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ========================
   MIDDLEWARE
======================== */
app.use(express.json());

app.use(
  cors({
    origin: [
      "https://elitedetailzz.github.io"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

/* ========================
   HEALTH CHECK (IMPORTANT)
======================== */
app.get("/health", (req, res) => {
  res.send("OK");
});

/* ========================
   EMAIL TRANSPORTER
======================== */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g. smtp.gmail.com
  port: process.env.EMAIL_PORT, // 587
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ========================
   SEND QUOTE ROUTE
======================== */
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

    console.log("Quote received:", req.body);

    const mailOptions = {
      from: `"Elite Detailz" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: "🚗 New Quote Request",
      html: `
        <h2>New Quote Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Vehicle Details:</strong> ${vehicleDetails}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Quote received successfully"
    });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({
      success: false,
      message: "Email failed to send"
    });
  }
});

/* ========================
   START SERVER
======================== */
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
