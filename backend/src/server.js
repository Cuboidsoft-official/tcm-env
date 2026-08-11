import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { createVisualSeedData } from "./data/visualSeed.js";
import { authRouter } from "./routes/auth.js";
import { homeRouter } from "./routes/home.js";
import { profileRouter } from "./routes/profile.js";
import { chatRouter } from "./routes/chat.js";
import { jobsRouter } from "./routes/jobs.js";
import { adminRouter } from "./routes/admin.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "tcm-backend",
    mongo: mongoose.connection.readyState
  });
});

app.use("/api/auth", authRouter);
app.use("/api/home", homeRouter);
app.use("/api/profile", profileRouter);
app.use("/api/chat", chatRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/admin", adminRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

import { User } from "./models/User.js";

async function ensureDefaultAdmin() {
  try {
    const passwordHash = await bcrypt.hash("password123", 12);
    const existing = await User.findOne({ email: "admin@tcm.com" });
    if (!existing) {
      await User.create({
        name: "Admin User",
        email: "admin@tcm.com",
        passwordHash,
        role: "admin",
        isApproved: true,
        verified: true,
        memberBadge: "TCM Administrator",
        bio: "TCM Platform Administrator"
      });
      console.log("Created default admin user (admin@tcm.com)");
    } else if (existing.role !== "admin") {
      existing.role = "admin";
      existing.isApproved = true;
      await existing.save();
    }
  } catch (e) {
    console.warn("Could not auto-create admin user in MongoDB:", e.message);
  }
}

async function ensureDefaultPartner() {
  try {
    const passwordHash = await bcrypt.hash("password123", 12);
    const existing = await User.findOne({ email: "partner@tcm.com" });
    if (!existing) {
      await User.create({
        name: "Future Tech Institute",
        instituteName: "Future Tech Institute",
        email: "partner@tcm.com",
        passwordHash,
        role: "partner",
        isApproved: true,
        verified: true,
        memberBadge: "TCM Partner Institute",
        partnerCategory: "TCM Partner Institute",
        location: "Bilaspur, Chhattisgarh",
        contactNumber: "+91 98765 43210",
        totalRevenue: "₹48,750",
        monthlyRevenue: "₹18,250",
        totalStudentsCount: 56,
        activeMentorsCount: 8,
        rating: 4.6,
        reviewsCount: "128 Reviews",
        existingCourses: ["Full Stack Development", "Python Programming", "Web Development"],
        avatarUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=300&q=80"
      });
      console.log("Created default partner user (partner@tcm.com)");
    }
  } catch (e) {
    console.warn("Could not auto-create partner user in MongoDB:", e.message);
  }
}

async function start() {
  try {
    await connectDatabase();
    await ensureDefaultAdmin();
    await ensureDefaultPartner();
  } catch (error) {
    console.warn("MongoDB unavailable. Starting with in-memory visual seed data.");
    const passwordHash = await bcrypt.hash("password123", 12);
    app.locals.memoryStore = createVisualSeedData(passwordHash);
  }

  app.listen(port, process.env.HOST || "0.0.0.0", () => {
    console.log(`API running on http://${process.env.HOST || "0.0.0.0"}:${port}`);
  });
}

start();
