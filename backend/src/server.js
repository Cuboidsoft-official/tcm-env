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

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    console.warn("MongoDB unavailable. Starting with in-memory visual seed data.");
    const passwordHash = await bcrypt.hash("password123", 12);
    app.locals.memoryStore = createVisualSeedData(passwordHash);
  }

  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

start();
