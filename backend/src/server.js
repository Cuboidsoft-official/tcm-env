import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { createVisualSeedData } from "./data/visualSeed.js";
import { authRouter } from "./routes/auth.js";
import { homeRouter, serveOpenGraphPreview } from "./routes/home.js";
import { profileRouter } from "./routes/profile.js";
import { chatRouter } from "./routes/chat.js";
import { jobsRouter } from "./routes/jobs.js";
import { adminRouter } from "./routes/admin.js";
import { uploadsRouter, UPLOADS_DIR } from "./routes/uploads.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true
  })
);
app.use(express.json({ limit: "120mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "tcm-backend",
    mongo: mongoose.connection.readyState
  });
});

// Top-Level OpenGraph Share Preview Endpoints for WhatsApp Crawlers
app.get("/post/:id", (req, res) => { req.params.type = "post"; serveOpenGraphPreview(req, res); });
app.get("/p/:id", (req, res) => { req.params.type = "post"; serveOpenGraphPreview(req, res); });
app.get("/job/:id", (req, res) => { req.params.type = "job"; serveOpenGraphPreview(req, res); });
app.get("/course/:id", (req, res) => { req.params.type = "course"; serveOpenGraphPreview(req, res); });
app.get("/community/:id", (req, res) => { req.params.type = "community"; serveOpenGraphPreview(req, res); });
app.get("/share/:type/:id", serveOpenGraphPreview);
app.get("/share/preview/:type/:id", serveOpenGraphPreview);
app.get("/api/share/:type/:id", serveOpenGraphPreview);
app.get("/api/share/preview/:type/:id", serveOpenGraphPreview);

app.use("/api/auth", authRouter);
app.use("/api/home", homeRouter);
app.use("/api/profile", profileRouter);
app.use("/api/chat", chatRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/uploads", uploadsRouter);

try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {
  console.warn(`Could not create uploads dir ${UPLOADS_DIR}: ${e.message}`);
}
app.use(
  "/uploads",
  express.static(UPLOADS_DIR, {
    maxAge: "30d",
    immutable: true,
    index: false,
    setHeaders(res, filePath) {
      const m = /\.(heic|heif|avif)$/i.exec(filePath);
      if (m) {
        const map = { heic: "image/heic", heif: "image/heif", avif: "image/avif" };
        res.setHeader("Content-Type", map[m[1].toLowerCase()]);
      }
    }
  })
);

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
        contactNumber: "",
        totalRevenue: "₹0",
        monthlyRevenue: "₹0",
        totalStudentsCount: 0,
        activeMentorsCount: 0,
        rating: 5.0,
        reviewsCount: "0 Reviews",
        existingCourses: [],
        avatarUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=300&q=80"
      });
      console.log("Created default partner user (partner@tcm.com)");
    } else {
      if (existing.totalRevenue === "₹48,750" || existing.monthlyRevenue === "₹18,250" || existing.totalStudentsCount === 56) {
        existing.totalRevenue = "₹0";
        existing.monthlyRevenue = "₹0";
        existing.totalStudentsCount = 0;
        existing.activeMentorsCount = 0;
        existing.rating = 5.0;
        existing.reviewsCount = "0 Reviews";
        existing.existingCourses = [];
        existing.enrolledCourses = [];
        await existing.save();
        console.log("Cleaned seed stats on partner@tcm.com in MongoDB");
      }
    }
  } catch (e) {
    console.warn("Could not auto-create partner user in MongoDB:", e.message);
  }
}

async function cleanDatabaseSeeds() {
  try {
    // 1. Strip fake auto-generated enrolledCourses from any user documents created by schema defaults
    await User.updateMany(
      { "enrolledCourses.coursePrice": "₹4,999", "enrolledCourses.enrolledDate": "14 May 2025" },
      { $set: { enrolledCourses: [] } }
    );
    // 2. Clean partner stats
    await User.updateMany(
      { email: "partner@tcm.com", totalRevenue: "₹48,750" },
      {
        $set: {
          totalRevenue: "₹0",
          monthlyRevenue: "₹0",
          totalStudentsCount: 0,
          activeMentorsCount: 0,
          rating: 5.0,
          reviewsCount: "0 Reviews",
          existingCourses: []
        }
      }
    );
  } catch (e) {
    console.warn("Seed cleanup check error:", e.message);
  }
}

async function start() {
  try {
    await connectDatabase();
    await ensureDefaultAdmin();
    await ensureDefaultPartner();
    await cleanDatabaseSeeds();
    try {
      const { hydratePushTokens } = await import("./services/pushNotificationService.js");
      await hydratePushTokens();
    } catch (e) {
      console.warn("Push token hydration skipped:", e.message);
    }
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
