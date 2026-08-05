import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing auth token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const memoryStore = req.app.locals.memoryStore;

    // 1. First try fetching real User from MongoDB database
    let dbUser = null;
    try {
      dbUser = await User.findById(payload.sub).select("-passwordHash").lean();
      if (!dbUser && payload.sub) {
        dbUser = await User.findOne({ email: payload.sub }).select("-passwordHash").lean();
      }
    } catch (e) {}

    if (dbUser) {
      req.user = dbUser;
      return next();
    }

    // 2. Fallback to memoryStore user
    if (memoryStore) {
      const users = memoryStore.users || [memoryStore.user].filter(Boolean);
      const user = users.find((item) => item._id === payload.sub || item.id === payload.sub || item.email === payload.sub);

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
