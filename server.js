import express from "express"; 
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { Resend } from "resend";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto"; // Native Node module for generating secure tokens

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Updated to allow JSON bodies and Authorization headers)
app.use(express.json()); 
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Connect to MongoDB Atlas
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("⚠️ WARNING: MONGO_URI environment variable is missing!");
} else {
  mongoose.connect(mongoURI)
    .then(() => console.log("✅ Elite Detailz MongoDB Connected Successfully!"))
    .catch(err => console.error("❌ MongoDB connection error:", err));
}

// Define the User Profile Database Blueprint
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// Health check
app.get("/", (req, res) => {
  res.send("✅ Elite Detailz backend is running");
});


/* ==========================================================================
   AUTHENTICATION & PROFILE FEATURES
   ========================================================================== */

// 1. REGISTER: Check if profile exists, hash password, save to Mongo
app.post("/api/register", async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() }, 
        { email: email.toLowerCase() }
      ] 
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username or Email already registered." });
    }

    // Encrypt password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: "Account created successfully! You can now sign in." });

  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// 2. LOGIN: Confirm user profile matching
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password." });
    }

    // Generate secure 24-hour browser access token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "ELITE_SECRET_KEY", { expiresIn: "24h" });

    res.json({ 
      message: "Logged in successfully!", 
      token, 
      user: { username: user.username, fullName: user.fullName } 
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// 3. FORGOT PASSWORD: Locate profile, create secure reset link, email via Resend
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // For safety, don't tell public hackers if an email exists or not. 
    // Say it sent either way, but actually fire the email only if it matches our profiles.
    if (!user) {
      return res.json({ message: "If that email matches an account, a recovery link has been sent." });
    }

    // Create unique random recovery token text that expires in 1 hour
    const token = crypto.randomBytes(20).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour tracking
    await user.save();

    // The reset URL landing configuration pointing to your live frontend
    const resetUrl = `https://elitedetailz.co.uk/reset-password.html?token=${token}`;

    // Dispatch recovery layout straight to user's personal inbox
    await resend.emails.send({
      from: process.env.FROM_EMAIL || "Elite Detailz <onboarding@resend.dev>",
      to: [user.email],
      subject: "🔒 Elite Detailz - Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.fullName},</p>
        <p>You requested a password reset for your Elite Detailz account.</p>
        <p>Please click the premium secure action link below to update your login credentials:</p>
        <p><a href="${resetUrl}" style="background:#7c3aed;color:#fff;padding:12px 20px;text-decoration:none;border-radius:25px;display:inline-block;font-weight:bold;">Reset My Password</a></p>
        <p style="font-size:0.85rem;color:#666;">This link will expire automatically in 1 hour. If you did not request this, you can ignore this security notification.</p>
      `
    });

    res.json({ message: "If that email matches an account, a recovery link has been sent." });

  } catch (error) {
    console.error("❌ Password recovery error:", error);
    res.status(500).json({ message: "Error running password recovery automation." });
  }
});


/* ==========================================================================
   ORIGINAL CAR QUOTE SYSTEM
   ========================================================================== */

app.post("/send-quote", upload.array("vehiclePhotos"), async (req, res) => {
  try {
    const { name, email, phone, service, date, time } = req.body;
    const files = req.files; 

    if (!name || !email || !phone || !service) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const attachments = files?.map(file => ({
      filename: file.originalname,
      content: file.buffer
    }));

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
        <p><strong>Vehicle Photos:</strong> See attachments</p>
      `,
      attachments
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