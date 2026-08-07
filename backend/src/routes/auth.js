import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Mentor } from "../models/Mentor.js";
import { sendOtpEmail } from "../services/emailService.js";

export const authRouter = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
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
    progress: user.progress || 0
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

authRouter.post("/register", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { name, email, password, role = "student", mentorCategory = "TCM Information Tech" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);

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
        role,
        mentorCategory,
        avatarUrl: "",
        progress: 0
      };

      users.push(user);

      if (role === "mentor") {
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
    const user = await User.create({ name, email: normalizedEmail, passwordHash, role, mentorCategory });

    if (role === "mentor") {
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
    const { email, name, avatarUrl, idToken, role = "student" } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Google user email is required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const googleName = name || normalizedEmail.split("@")[0];
    const googleAvatar = avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

    if (memoryStore) {
      const users = getMemoryUsers(memoryStore);
      let user = users.find((u) => u.email === normalizedEmail);

      if (!user) {
        user = {
          _id: `google-user-${Date.now()}`,
          name: googleName,
          email: normalizedEmail,
          passwordHash: await bcrypt.hash(`google_${Date.now()}`, 10),
          role,
          avatarUrl: googleAvatar,
          verified: true,
          progress: 0
        };
        users.push(user);
      } else {
        user.avatarUrl = googleAvatar;
        user.verified = true;
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
        role,
        avatarUrl: googleAvatar,
        verified: true
      });
    } else {
      user.avatarUrl = googleAvatar;
      user.verified = true;
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

// Password Reset OTP Store
const otpStore = {}; // email -> { otp, expiresAt }

// Send Password Reset OTP
authRouter.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const normalizedEmail = normalizeEmail(email);

    // Verify user exists
    let user = null;
    if (memoryStore) {
      const users = getMemoryUsers(memoryStore);
      user = users.find((u) => u.email === normalizedEmail);
    } else {
      user = await User.findOne({ email: normalizedEmail });
    }

    if (!user) {
      return res.status(444).json({ message: "No account found with this email address." });
    }

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[normalizedEmail] = {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    console.log(`🔑 Password Reset OTP for ${normalizedEmail}: ${generatedOtp}`);

    // Dispatch real email via Nodemailer
    sendOtpEmail({
      toEmail: normalizedEmail,
      otp: generatedOtp,
      userName: user.name || "Learner"
    }).catch(() => {});

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

    if (Date.now() > stored.expiresAt) {
      delete otpStore[normalizedEmail];
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    if (stored.otp !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid OTP code. Please check and try again." });
    }

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

    if (!stored || stored.otp !== String(otp).trim()) {
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
