import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { createVisualSeedData } from "./data/visualSeed.js";
import { authRouter } from "./routes/auth.js";
import { homeRouter } from "./routes/home.js";
import { profileRouter } from "./routes/profile.js";
import { chatRouter } from "./routes/chat.js";
import { jobsRouter } from "./routes/jobs.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Behind the Caddy reverse proxy we must trust the forwarded IP for rate limiting.
app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." }
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn("WARNING: JWT_SECRET is not set to a strong value. Authentication will fail closed.");
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "tcm-backend",
    mongo: mongoose.connection.readyState
  });
});

app.use("/api/auth", authLimiter);
app.use("/api/auth/forgot-password", otpLimiter);
app.use("/api/auth", authRouter);
app.use("/api/home", homeRouter);
app.use("/api/profile", profileRouter);
app.use("/api/chat", chatRouter);
app.use("/api/jobs", jobsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler — never leak internal error details to clients.
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Not allowed by CORS" });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

async function start() {
  try {
    await connectDatabase();
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
