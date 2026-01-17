import express from "express"; 
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";
import multer from "multer";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// Keep JSON for normal requests
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" }); // temporary storage for uploaded images

// Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// Health check
app.get("/", (req, res) => {
  res.send("✅ Elite Detailz backend is running");
});

// Quote endpoint with file upload
app.post("/send-quote", upload.single("vehicleImage"), async (req, res) => {
  try {
    const { name, email, phone, service, date, time } = req.body;
    const vehicleImage = req.file;

    // Basic validation
    if (!name || !email || !phone || !service) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Optional: Convert image to Base64 to embed in email
    let vehicleImageHTML = "No image uploaded";
    if (vehicleImage) {
      const imageBase64 = Buffer.from(fs.readFileSync(vehicleImage.path)).toString("base64");
      vehicleImageHTML = `<p><strong>Vehicle Image:</strong></p>
      <img src="data:${vehicleImage.mimetype};base64,${imageBase64}" width="300">`;
    }

    // Send email via Resend
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
        ${vehicleImageHTML}
      `
    });

    res.status(200).json({ success: true });

    // Optional: remove the uploaded file after sending email
    if (vehicleImage) fs.unlinkSync(vehicleImage.path);

  } catch (error) {
    console.error("❌ Email error:", error);
    res.status(500).json({ error: "Failed to send quote" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
