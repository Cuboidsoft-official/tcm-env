import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const TOKEN_ISSUER = "tcm";
const TOKEN_AUDIENCE = "tcm-app";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing auth token" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      return res.status(500).json({ message: "Server auth is not configured" });
    }

    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    });

    if (!payload || !payload.sub || typeof payload.sub !== "string") {
      return res.status(401).json({ message: "Invalid auth token" });
    }

    const memoryStore = req.app.locals.memoryStore;

    // 1. First try fetching real User from MongoDB database
    let dbUser = null;
    try {
      dbUser = await User.findById(payload.sub).select("-passwordHash").lean();
    } catch (e) {}

    if (dbUser) {
      req.user = dbUser;
      return next();
    }

    // 2. Fallback to memoryStore user (dev / no-DB mode only)
    if (memoryStore) {
      const users = memoryStore.users || [memoryStore.user].filter(Boolean);
      const user = users.find((item) => item._id === payload.sub || item.id === payload.sub);

      if (user) {
        req.user = user;
        return next();
      }
    }

    return res.status(401).json({ message: "User not found" });
  } catch (error) {
    res.status(401).json({ message: "Invalid auth token" });
  }
}
