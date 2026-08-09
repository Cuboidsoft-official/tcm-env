import bcrypt from "bcryptjs";
import crypto from "crypto";
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Mentor } from "../models/Mentor.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { CommunityPost } from "../models/CommunityPost.js";
import { requireAuth } from "../middleware/auth.js";
import { sendOtpEmail } from "../services/emailService.js";

export const authRouter = express.Router();

const TOKEN_ISSUER = "tcm";
const TOKEN_AUDIENCE = "tcm-app";
const GOOGLE_WEB_CLIENT_ID =
  process.env.GOOGLE_WEB_CLIENT_ID || "1018503930810-nuht0vf2crgh0k5e5da65f6hb4g3p7qn.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.GOOGLE_ANDROID_CLIENT_ID || "1018503930810-c5k899vccnese1ndfvrfn40jf9uqbaoj.apps.googleusercontent.com";

// Roles a user may self-assign. "admin" is reserved for the backend owner.
const SELF_ASSIGNABLE_ROLES = new Set(["student", "mentor"]);

function validateSelfRole(role) {
  if (!role) return "student";
  if (!SELF_ASSIGNABLE_ROLES.has(role)) return null;
  return role;
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      algorithm: "HS256",
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    }
  );
}

export function publicUser(user) {
  const userHandle = user.handle || (user.email ? user.email.split("@")[0] : "member");
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || "",
    handle: userHandle,
    verified: user.verified !== undefined ? user.verified : false,
    memberBadge: user.memberBadge || (user.role === "mentor" ? "TCM Mentor" : "TCM Member"),
    mentorCategory: user.mentorCategory || "TCM Information Tech",
    yearsExperience: user.yearsExperience || "5+ Yrs Exp",
    subjects: user.subjects || ["Full Stack Development", "React Native", "Node.js & MongoDB", "System Design"],
    experiences: user.experiences || [
      { id: "exp1", role: "Senior Software Engineer & Mentor", company: "TCM Academy", durationPill: "3+ Years", icon: "school", iconColor: "#5B3CF5" }
    ],
    certifications: user.certifications || ["Certified Technical Instructor", "Full Stack Systems Architect"],
    interests: user.interests || ["System Architecture", "AI & Machine Learning", "Student Mentorship"],
    bio: user.bio || "",
    location: user.location || "",
    joinedDate: user.joinedDate || `Joined ${new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
    website: user.website || "",
    stats: user.stats || {
      postsCount: 0,
      followers: "0",
      following: 0,
      reputation: "0"
    },
    quickTools: user.quickTools || {
      savedCount: 0,
      draftsCount: 0,
      deletedCount: 0
    },
    progress: user.progress || 0,
    referredBy: user.referredBy || "",
    referralAppliedAt: user.referralAppliedAt || null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : user.createdAtIso || new Date().toISOString()
  };
}

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function getMemoryUsers(memoryStore) {
  if (!memoryStore.users) {
    memoryStore.users = [memoryStore.user].filter(Boolean);
  }

  return memoryStore.users;
}

async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    return { error: "Missing Google ID token" };
  }

  let response;
  try {
    response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  } catch (e) {
    return { error: "Could not reach Google token verification service" };
  }

  if (!response.ok) {
    return { error: "Google token verification failed" };
  }

  const info = await response.json();

  if (info.aud !== GOOGLE_WEB_CLIENT_ID && info.aud !== GOOGLE_ANDROID_CLIENT_ID) {
    return { error: "Google token audience mismatch" };
  }

  if (String(info.email_verified) !== "true") {
    return { error: "Google account email is not verified" };
  }

  return { payload: info };
}

authRouter.post("/register", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { name, email, password, role = "student", mentorCategory = "TCM Information Tech", referralCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const safeRole = validateSelfRole(role);
    if (!safeRole) {
      return res.status(403).json({ message: "You are not allowed to register with this role" });
    }

    const normalizedEmail = normalizeEmail(email);
    const cleanRefCode = referralCode ? String(referralCode).trim().toUpperCase() : "";
    const nowIso = new Date().toISOString();

    if (memoryStore) {
      const users = getMemoryUsers(memoryStore);

      if (users.some((user) => user.email === normalizedEmail)) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = {
        _id: `seed-user-${Date.now()}`,
        name,
        email: normalizedEmail,
        passwordHash,
        role: safeRole,
        mentorCategory,
        avatarUrl: "",
        progress: 0,
        referredBy: cleanRefCode,
        referralAppliedAt: cleanRefCode ? new Date() : null,
        createdAt: nowIso,
        createdAtIso: nowIso
      };

      users.push(user);

      if (safeRole === "mentor") {
        if (!Array.isArray(memoryStore.mentors)) {
          memoryStore.mentors = [];
        }
        memoryStore.mentors.unshift({
          _id: user._id,
          id: user._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          title: `${user.mentorCategory} Senior Mentor`,
          mentorCategory: user.mentorCategory,
          rating: 5.0,
          learners: "1.2K+",
          avatarUrl: user.avatarUrl,
          skills: ["Mentorship", "Live Sessions", user.mentorCategory]
        });
      }

      return res.status(201).json({
        token: signToken(user),
        user: publicUser(user)
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: safeRole,
      mentorCategory,
      referredBy: cleanRefCode,
      referralAppliedAt: cleanRefCode ? new Date() : null
    });

    if (safeRole === "mentor") {
      try {
        await Mentor.create({
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          title: `${user.mentorCategory} Senior Mentor`,
          mentorCategory: user.mentorCategory,
          rating: 5.0,
          learners: "1.2K+",
          skills: ["Mentorship", "Live Sessions", user.mentorCategory]
        });
      } catch (mErr) {
        console.warn("Could not auto-create Mentor document:", mErr);
      }
    }

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Could not create account" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);

    if (memoryStore) {
      const users = getMemoryUsers(memoryStore);
      const user = users.find((item) => item.email === normalizedEmail);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      return res.json({
        token: signToken(user),
        user: publicUser(user)
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Could not log in" });
  }
});

// Google Authentication Route
authRouter.post("/google", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { email, name, avatarUrl, idToken, role = "student", referralCode } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Google user email is required" });
    }

    const safeRole = validateSelfRole(role);
    if (!safeRole) {
      return res.status(403).json({ message: "You are not allowed to use this role" });
    }

    const { error, payload } = await verifyGoogleIdToken(idToken);
    if (error) {
      return res.status(401).json({ message: error });
    }

    const normalizedEmail = normalizeEmail(email);
    if (payload.email && payload.email.toLowerCase() !== normalizedEmail) {
      return res.status(401).json({ message: "Google token email mismatch" });
    }

    const googleName = name || payload.name || normalizedEmail.split("@")[0];
    const googleAvatar = avatarUrl || payload.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
    const cleanRefCode = referralCode ? String(referralCode).trim().toUpperCase() : "";
    const nowIso = new Date().toISOString();

    if (memoryStore) {
      const users = getMemoryUsers(memoryStore);
      let user = users.find((u) => u.email === normalizedEmail);

      if (!user) {
        user = {
          _id: `google-user-${Date.now()}`,
          name: googleName,
          email: normalizedEmail,
          passwordHash: await bcrypt.hash(`google_${Date.now()}`, 10),
          role: safeRole,
          avatarUrl: googleAvatar,
          verified: true,
          progress: 0,
          referredBy: cleanRefCode,
          referralAppliedAt: cleanRefCode ? new Date() : null,
          createdAt: nowIso,
          createdAtIso: nowIso
        };
        users.push(user);
      } else {
        user.avatarUrl = googleAvatar;
        user.verified = true;
        if (!user.referredBy && cleanRefCode) {
          user.referredBy = cleanRefCode;
          user.referralAppliedAt = new Date();
        }
      }

      return res.json({
        token: signToken(user),
        user: publicUser(user)
      });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const passwordHash = await bcrypt.hash(`google_${Date.now()}`, 10);
      user = await User.create({
        name: googleName,
        email: normalizedEmail,
        passwordHash,
        role: safeRole,
        avatarUrl: googleAvatar,
        verified: true,
        referredBy: cleanRefCode,
        referralAppliedAt: cleanRefCode ? new Date() : null
      });
    } else {
      user.avatarUrl = googleAvatar;
      user.verified = true;
      if (!user.referredBy && cleanRefCode) {
        user.referredBy = cleanRefCode;
        user.referralAppliedAt = new Date();
      }
      await user.save();
    }

    res.json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Could not authenticate with Google" });
  }
});

// Account deletion (required by Apple App Store 5.1.1(v) / Google Play data deletion)
authRouter.delete("/account", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    if (req.app.locals.memoryStore) {
      const users = getMemoryUsers(req.app.locals.memoryStore);
      req.app.locals.memoryStore.users = users.filter((u) => u._id.toString() !== userId && u.id !== userId);
      return res.json({ success: true, message: "Account deleted" });
    }

    await User.deleteOne({ _id: req.user._id });
    await Mentor.deleteMany({ userId });

    try {
      await ChatMessage.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });
    } catch (e) {}
    try {
      await CommunityPost.deleteMany({ authorId: userId });
    } catch (e) {}

    return res.json({ success: true, message: "Account deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete account" });
  }
});

// Password Reset OTP Store (in-memory; persisted per-instance only)
const otpStore = {}; // email -> { otp, expiresAt, verified, attempts }
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// Send Password Reset OTP
authRouter.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const normalizedEmail = normalizeEmail(email);

    // Verify user exists (do not reveal existence — return the same message either way)
    let user = null;
    if (memoryStore) {
      const users = getMemoryUsers(memoryStore);
      user = users.find((u) => u.email === normalizedEmail);
    } else {
      user = await User.findOne({ email: normalizedEmail });
    }

    if (!user) {
      return res.json({ success: true, message: `If an account exists for ${normalizedEmail}, a verification OTP has been sent.` });
    }

    const generatedOtp = crypto.randomInt(100000, 1000000).toString();
    otpStore[normalizedEmail] = {
      otp: generatedOtp,
      expiresAt: Date.now() + OTP_TTL_MS,
      verified: false,
      attempts: 0
    };

    if (process.env.NODE_ENV !== "production") {
      console.log(`🔑 Password Reset OTP for ${normalizedEmail}: ${generatedOtp}`);
    }

    const result = await sendOtpEmail({
      toEmail: normalizedEmail,
      otp: generatedOtp,
      userName: user.name || "Learner"
    });

    if (!result.success) {
      delete otpStore[normalizedEmail];
      return res.status(500).json({ message: "Could not send the OTP email. Please try again later." });
    }

    return res.json({
      success: true,
      message: `Verification OTP code has been sent to ${normalizedEmail}. Please check your email inbox.`
    });
  } catch (error) {
    res.status(500).json({ message: "Could not send OTP" });
  }
});

// Verify Password Reset OTP
authRouter.post("/forgot-password/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const stored = otpStore[normalizedEmail];

    if (!stored) {
      return res.status(400).json({ message: "No OTP request found for this email. Request a new OTP." });
    }

    if (stored.attempts >= MAX_OTP_ATTEMPTS) {
      delete otpStore[normalizedEmail];
      return res.status(400).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    if (Date.now() > stored.expiresAt) {
      delete otpStore[normalizedEmail];
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    if (stored.otp !== String(otp).trim()) {
      stored.attempts += 1;
      return res.status(400).json({ message: "Invalid OTP code. Please check and try again." });
    }

    stored.verified = true;

    res.json({
      success: true,
      message: "OTP verified successfully. You may now reset your password."
    });
  } catch (error) {
    res.status(500).json({ message: "Could not verify OTP" });
  }
});

// Reset Password with Verified OTP
authRouter.post("/forgot-password/reset-password", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = normalizeEmail(email);
    const stored = otpStore[normalizedEmail];

    if (!stored || !stored.verified) {
      return res.status(400).json({ message: "Please verify the OTP first." });
    }

    if (Date.now() > stored.expiresAt) {
      delete otpStore[normalizedEmail];
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    if (stored.otp !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid or unverified OTP." });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    if (memoryStore) {
      const users = getMemoryUsers(memoryStore);
      const user = users.find((u) => u.email === normalizedEmail);
      if (user) {
        user.passwordHash = newPasswordHash;
      }
    } else {
      await User.updateOne({ email: normalizedEmail }, { passwordHash: newPasswordHash });
    }

    delete otpStore[normalizedEmail];

    res.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password."
    });
  } catch (error) {
    res.status(500).json({ message: "Could not reset password" });
  }
});
