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
    origin: "*", // ✅ TEMPORARILY allow all (fixes GitHub Pages)
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

// ✅ REQUIRED for preflight
app.options("*", cors());

/* ========================
   HEALTH CHECK
======================== */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* ========================
   EMAIL TRANSPORTER
======================== */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ========================
   SEND QUOTE
======================== */
app.post("/send-quote", async (req, res) => {
  try {
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

    await transporter.sendMail({
      from: `"Elite Detailz" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: "🚗 New Quote Request",
      html: `
        <h2>New Quote Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Service:</b> ${service}</p>
        <p><b>Date:</b> ${date}</p>
        <p><b>Time:</b> ${time}</p>
        <p><b>Vehicle:</b> ${vehicleDetails}</p>
      `
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Send error:", err);
    res.status(500).json({ success: false });
  }
});

/* ========================
   START SERVER
======================== */
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
