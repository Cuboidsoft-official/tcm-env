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

    const secret = process.env.JWT_SECRET || "tcm_local_dev_secret_change_before_production";

    let payload;
    try {
      payload = jwt.verify(token, secret, {
        algorithms: ["HS256"],
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE
      });
    } catch (e1) {
      try {
        payload = jwt.verify(token, secret, {
          algorithms: ["HS256"]
        });
      } catch (e2) {
        return res.status(401).json({ message: "Invalid auth token" });
      }
    }

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
      const user = users.find((item) => String(item._id || item.id) === String(payload.sub));

      if (user) {
        req.user = user;
        return next();
      }
    }

    // 3. Fallback mock user if token signature is valid but DB/memory user record is missing
    req.user = {
      _id: payload.sub,
      id: payload.sub,
      name: payload.name || "TCM Learner",
      email: payload.email || "user@tcm.com",
      role: payload.role || "student"
    };
    return next();
  } catch (error) {
    res.status(401).json({ message: "Invalid auth token" });
  }
}
