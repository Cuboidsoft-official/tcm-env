import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Mentor } from "../models/Mentor.js";
import { sendOtpEmail } from "../services/emailService.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = express.Router();

const TOKEN_ISSUER = "tcm";
const TOKEN_AUDIENCE = "tcm-app";

function signToken(user) {
  const secret = process.env.JWT_SECRET || "tcm_local_dev_secret_change_before_production";
  return jwt.sign(
    {
      sub: String(user._id || user.id),
      role: user.role,
      name: user.name,
      email: user.email
    },
    secret,
    {
      expiresIn: "30d",
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    }
  );
}

export function publicUser(user) {
  let userHandle = user.handle;
  if (!userHandle || userHandle === "ayushman" || userHandle === "ayushman.dev") {
    if (user.name) {
      userHandle = user.name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    } else if (user.email) {
      userHandle = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_");
    } else {
      userHandle = "member";
    }
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isApproved: user.isApproved !== undefined ? user.isApproved : (user.role === "mentor" ? false : true),
    avatarUrl: user.avatarUrl || "",
    handle: userHandle,
    verified: user.verified !== undefined ? user.verified : false,
    memberBadge: user.memberBadge || (user.role === "partner" ? "TCM Partner Institute" : user.role === "mentor" ? "TCM Mentor" : "TCM Member"),
    mentorCategory: user.mentorCategory || "TCM Information Tech",
    instituteName: user.instituteName || user.name || "Future Tech Institute",
    partnerCategory: user.partnerCategory || "TCM Partner Institute",
    contactNumber: user.contactNumber || "+91 98765 43210",
    totalRevenue: user.totalRevenue || "₹48,750",
    monthlyRevenue: user.monthlyRevenue || "₹18,250",
    totalStudentsCount: user.totalStudentsCount !== undefined ? user.totalStudentsCount : 56,
    activeMentorsCount: user.activeMentorsCount !== undefined ? user.activeMentorsCount : 8,
    rating: user.rating || 4.6,
    reviewsCount: user.reviewsCount || "128 Reviews",
    existingCourses: user.existingCourses || ["Full Stack Development", "Python Programming", "Web Development"],
    galleryPhotos: user.galleryPhotos || [],
    recentStudents: user.recentStudents || [
      { id: "s1", name: "Aman Verma", course: "Full Stack Development", date: "20 May 2025", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" },
      { id: "s2", name: "Priya Sahu", course: "Python Programming", date: "18 May 2025", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120" },
      { id: "s3", name: "Rohit Patel", course: "Web Development", date: "15 May 2025", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120" }
    ],
    yearsExperience: user.yearsExperience || "5+ Yrs Exp",
    subjects: user.subjects || ["Full Stack Development", "React Native", "Node.js & MongoDB", "System Design"],
    experiences: user.experiences || [
      { id: "exp1", role: "Senior Software Engineer & Mentor", company: "TCM Academy", durationPill: "3+ Years", icon: "school", iconColor: "#5B3CF5" }
    ],
    certifications: user.certifications || ["Certified Technical Instructor", "Full Stack Systems Architect"],
    interests: user.interests || ["System Architecture", "AI & Machine Learning", "Student Mentorship"],
    skills: user.skills || [],
    bio: user.bio || "",
    location: user.location || "Bilaspur, Chhattisgarh",
    city: user.city || (user.location || "Bilaspur").split(",")[0].trim(),
    gmbLink: user.gmbLink || "",
    heroCover: user.heroCover || "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
    labFee: user.labFee || "₹0 - ₹100 /hr",
    timings: user.timings || "9:00 AM - 8:00 PM",
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
    tcmCoins: user.tcmCoins !== undefined ? user.tcmCoins : 0,
    referralCode: getOrGenerateReferralCode(user),
    referredBy: user.referredBy || "",
    referralAppliedAt: user.referralAppliedAt || null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : user.createdAtIso || new Date().toISOString()
  };
}

export function getOrGenerateReferralCode(user) {
  if (!user) return "TCM25X";
  if (user.referralCode) return String(user.referralCode).toUpperCase();
  const rawName = (user.name || user.email || "TCM").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = rawName.substring(0, 3).padEnd(3, "X");
  return `${prefix}25X`.substring(0, 6);
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
    const { name, email, password, role = "student", mentorCategory = "TCM Information Tech", referralCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const cleanRefCode = referralCode ? String(referralCode).trim().toUpperCase() : "";
    const nowIso = new Date().toISOString();
    const isMentorRole = role === "mentor";
    const isApproved = !isMentorRole; // Mentors default to pending approval (false)

    if (memoryStore) {
      const users = getMemoryUsers(memoryStore);

      if (users.some((user) => user.email === normalizedEmail)) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = {
        _id: `user-${Date.now()}`,
        name,
        email: normalizedEmail,
        passwordHash,
        role,
        isApproved,
        mentorCategory,
        avatarUrl: "",
        progress: 0,
        referredBy: cleanRefCode,
        referralAppliedAt: cleanRefCode ? new Date() : null,
        createdAt: nowIso,
        createdAtIso: nowIso
      };

      users.push(user);

      if (isMentorRole) {
        if (!Array.isArray(memoryStore.mentors)) {
          memoryStore.mentors = [];
        }
        memoryStore.mentors.unshift({
          _id: user._id,
          id: user._id,
          userId: user._id,
          name: user.name,
          email: user.email,
          title: `${user.mentorCategory} Mentor`,
          mentorCategory: user.mentorCategory,
          isApproved: false,
          rating: 5.0,
          learners: "0",
          avatarUrl: user.avatarUrl,
          skills: ["Mentorship", user.mentorCategory]
        });
      }

      return res.status(201).json({
        token: signToken(user),
        user: publicUser(user),
        message: isMentorRole ? "Mentor account registered! Pending admin approval before public listing." : "Account created successfully."
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
      role,
      isApproved,
      mentorCategory,
      referredBy: cleanRefCode,
      referralAppliedAt: cleanRefCode ? new Date() : null
    });

    if (isMentorRole) {
      try {
        await Mentor.create({
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          title: `${user.mentorCategory} Mentor`,
          mentorCategory: user.mentorCategory,
          isApproved: false,
          rating: 5.0,
          learners: "0",
          skills: ["Mentorship", user.mentorCategory]
        });
      } catch (mErr) {
        console.warn("Could not auto-create Mentor document:", mErr);
      }
    }

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user),
      message: isMentorRole ? "Mentor account registered! Pending admin approval before public listing." : "Account created successfully."
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

    const normalizedEmail = normalizeEmail(email);
    const googleName = name || normalizedEmail.split("@")[0];
    const googleAvatar = avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
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
          role,
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
        role,
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

// Public Endpoint to Fetch All Partners & Collaborators
authRouter.get("/partners", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    if (memoryStore) {
      const users = memoryStore.users || [memoryStore.user].filter(Boolean);
      const partners = users.filter((u) => u.role === "partner").map(publicUser);
      return res.json({ partners });
    }

    const partners = await User.find({ role: "partner" }).sort({ createdAt: -1 });
    res.json({ partners: partners.map(publicUser) });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch partners", error: error.message });
  }
});

// Student Account Deletion Endpoint
authRouter.delete("/delete-account", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const role = req.user?.role;

    if (role && role !== "student") {
      return res.status(403).json({
        message: "Account deletion via Profile Settings is only available for Student accounts. Mentors and Institute Partners must contact support."
      });
    }

    const memoryStore = req.app.locals.memoryStore;
    if (memoryStore) {
      if (Array.isArray(memoryStore.users)) {
        memoryStore.users = memoryStore.users.filter((u) => String(u._id || u.id) !== String(userId));
      }
      if (memoryStore.user && String(memoryStore.user._id || memoryStore.user.id) === String(userId)) {
        memoryStore.user = null;
      }
    }

    try {
      await User.findByIdAndDelete(userId);
    } catch (e) {}

    res.json({
      success: true,
      message: "Your account has been deleted permanently."
    });
  } catch (error) {
    res.status(500).json({ message: "Could not delete account", error: error.message });
  }
});
