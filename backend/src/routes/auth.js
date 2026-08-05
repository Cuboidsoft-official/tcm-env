import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Mentor } from "../models/Mentor.js";

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
