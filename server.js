import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// Health check (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("✅ Elite Detailz backend is running");
});

// Quote endpoint
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

    // Basic validation
    if (!name || !email || !phone || !service) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL || "Elite Detailz <onboarding@resend.dev>",
      to: [process.env.EMAIL_TO],
      subject: "🚗 New Quote Request",
      html: `
        <h2>New Quote Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Date:</strong> ${date || "N/A"}</p>
        <p><strong>Time:</strong> ${time || "N/A"}</p>
        <p><strong>Vehicle Details:</strong> ${vehicleDetails || "N/A"}</p>
      `
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Email error:", error);
    res.status(500).json({ error: "Failed to send quote" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

