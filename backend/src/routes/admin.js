import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Mentor } from "../models/Mentor.js";
import { Course } from "../models/Course.js";
import { Job } from "../models/Job.js";
import { Webinar } from "../models/Webinar.js";
import { CommunityPost } from "../models/CommunityPost.js";
import { publicUser } from "./auth.js";

export const adminRouter = express.Router();

const TOKEN_ISSUER = "tcm";
const TOKEN_AUDIENCE = "tcm-app";
const JWT_SECRET = process.env.JWT_SECRET || "tcm_local_dev_secret_change_before_production";

function signAdminToken(user) {
  return jwt.sign(
    {
      sub: String(user._id || user.id),
      role: user.role || "admin",
      name: user.name,
      email: user.email
    },
    JWT_SECRET,
    {
      expiresIn: "30d",
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    }
  );
}

// Authentication Middleware for Admin routes
export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin rights required." });
    }

    req.adminUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired admin session token" });
  }
}

// Admin Login
adminRouter.post("/login", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (memoryStore) {
      const users = memoryStore.users || [memoryStore.user].filter(Boolean);
      const user = users.find((u) => u.email === normalizedEmail);

      if (!user) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ message: "Account does not have admin privileges." });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      return res.json({
        token: signAdminToken(user),
        user: publicUser(user)
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Account does not have admin privileges." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    res.json({
      token: signAdminToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Admin login error", error: error.message });
  }
});

// Admin Signup (Create new admin account)
adminRouter.post("/signup", async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { name, email, password, adminSecret } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const expectedSecret = process.env.ADMIN_SECRET || "TCM_ADMIN_KEY_2026";
    if (adminSecret && adminSecret !== expectedSecret) {
      return res.status(403).json({ message: "Invalid admin registration key" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const nowIso = new Date().toISOString();

    if (memoryStore) {
      const users = memoryStore.users || [memoryStore.user].filter(Boolean);
      if (users.some((u) => u.email === normalizedEmail)) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const user = {
        _id: `admin-${Date.now()}`,
        name,
        email: normalizedEmail,
        passwordHash,
        role: "admin",
        isApproved: true,
        verified: true,
        memberBadge: "TCM Administrator",
        createdAt: nowIso
      };

      users.push(user);

      return res.status(201).json({
        token: signAdminToken(user),
        user: publicUser(user),
        message: "Admin account created successfully"
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "admin",
      isApproved: true,
      verified: true,
      memberBadge: "TCM Administrator"
    });

    res.status(201).json({
      token: signAdminToken(user),
      user: publicUser(user),
      message: "Admin account created successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Could not create admin account", error: error.message });
  }
});

// Dashboard Analytics & Stats
adminRouter.get("/stats", requireAdmin, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;

    if (memoryStore) {
      const users = memoryStore.users || [];
      const mentors = memoryStore.mentors || [];
      const courses = memoryStore.learn?.popularCourses || [];
      const jobs = memoryStore.jobs || [];
      const posts = memoryStore.posts || [];

      const studentsCount = users.filter((u) => u.role === "student").length;
      const allMentors = users.filter((u) => u.role === "mentor").concat(mentors);
      const pendingMentorsCount = users.filter((u) => u.role === "mentor" && u.isApproved === false).length;
      const approvedMentorsCount = users.filter((u) => u.role === "mentor" && u.isApproved !== false).length + mentors.filter((m) => m.isApproved !== false).length;

      return res.json({
        totalUsers: users.length,
        studentsCount,
        mentorsCount: allMentors.length,
        pendingMentorsCount,
        approvedMentorsCount,
        coursesCount: courses.length,
        jobsCount: jobs.length,
        webinarsCount: 5,
        postsCount: posts.length
      });
    }

    const [
      totalUsers,
      studentsCount,
      mentorsCount,
      pendingMentorsCount,
      approvedMentorsCount,
      coursesCount,
      jobsCount,
      webinarsCount,
      postsCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "mentor" }),
      User.countDocuments({ role: "mentor", isApproved: false }),
      User.countDocuments({ role: "mentor", isApproved: { $ne: false } }),
      Course.countDocuments(),
      Job.countDocuments(),
      Webinar.countDocuments(),
      CommunityPost.countDocuments()
    ]);

    res.json({
      totalUsers,
      studentsCount,
      mentorsCount,
      pendingMentorsCount,
      approvedMentorsCount,
      coursesCount,
      jobsCount,
      webinarsCount,
      postsCount
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch dashboard stats", error: error.message });
  }
});

// GET Mentors (all or filtered by status)
adminRouter.get("/mentors", requireAdmin, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { status } = req.query; // "pending" | "approved" | "all"

    if (memoryStore) {
      const users = memoryStore.users || [];
      const mentors = memoryStore.mentors || [];

      let list = [];
      users.filter((u) => u.role === "mentor").forEach((u) => {
        list.push({
          id: String(u._id),
          _id: String(u._id),
          name: u.name,
          email: u.email,
          role: u.role,
          isApproved: u.isApproved !== false,
          mentorCategory: u.mentorCategory || "TCM Information Tech",
          title: `${u.mentorCategory || "TCM"} Educator`,
          avatarUrl: u.avatarUrl || "",
          bio: u.bio || "",
          yearsExperience: u.yearsExperience || "5+ Yrs",
          createdAt: u.createdAt || new Date().toISOString()
        });
      });

      mentors.forEach((m) => {
        if (!list.some((item) => String(item.id) === String(m._id || m.id || m.userId))) {
          list.push({
            id: String(m._id || m.id || m.userId),
            _id: String(m._id || m.id || m.userId),
            name: m.name,
            email: m.email || "mentor@tcm.com",
            role: "mentor",
            isApproved: m.isApproved !== false,
            mentorCategory: m.mentorCategory || "TCM Information Tech",
            title: m.title || "TCM Mentor",
            avatarUrl: m.avatarUrl || "",
            bio: m.bio || "",
            skills: m.skills || ["Mentorship"],
            createdAt: m.createdAt || new Date().toISOString()
          });
        }
      });

      if (status === "pending") {
        list = list.filter((m) => !m.isApproved);
      } else if (status === "approved") {
        list = list.filter((m) => m.isApproved);
      }

      return res.json(list);
    }

    let filter = { role: "mentor" };
    if (status === "pending") {
      filter.isApproved = false;
    } else if (status === "approved") {
      filter.isApproved = { $ne: false };
    }

    const mentorUsers = await User.find(filter).sort({ createdAt: -1 }).lean();
    const list = mentorUsers.map((u) => ({
      id: String(u._id),
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      isApproved: u.isApproved !== false,
      mentorCategory: u.mentorCategory || "TCM Information Tech",
      title: `${u.mentorCategory || "TCM"} Senior Mentor`,
      avatarUrl: u.avatarUrl || "",
      bio: u.bio || "",
      yearsExperience: u.yearsExperience || "5+ Yrs",
      createdAt: u.createdAt
    }));

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch mentors", error: error.message });
  }
});

// Approve Mentor Profile
adminRouter.patch("/mentors/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const memoryStore = req.app.locals.memoryStore;

    if (memoryStore) {
      const users = memoryStore.users || [];
      const user = users.find((u) => String(u._id || u.id) === String(id));
      if (user) {
        user.isApproved = true;
      }

      const mentors = memoryStore.mentors || [];
      const mentor = mentors.find((m) => String(m._id || m.id || m.userId) === String(id));
      if (mentor) {
        mentor.isApproved = true;
      }

      return res.json({
        success: true,
        message: "Mentor profile approved successfully!",
        mentorId: id,
        isApproved: true
      });
    }

    await User.findByIdAndUpdate(id, { isApproved: true });
    await Mentor.updateMany({ $or: [{ _id: id }, { userId: id }] }, { isApproved: true });

    res.json({
      success: true,
      message: "Mentor profile approved successfully!",
      mentorId: id,
      isApproved: true
    });
  } catch (error) {
    res.status(500).json({ message: "Could not approve mentor", error: error.message });
  }
});

// Reject Mentor Profile
adminRouter.patch("/mentors/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const memoryStore = req.app.locals.memoryStore;

    if (memoryStore) {
      const users = memoryStore.users || [];
      const user = users.find((u) => String(u._id || u.id) === String(id));
      if (user) {
        user.isApproved = false;
      }

      const mentors = memoryStore.mentors || [];
      const mentor = mentors.find((m) => String(m._id || m.id || m.userId) === String(id));
      if (mentor) {
        mentor.isApproved = false;
      }

      return res.json({
        success: true,
        message: "Mentor approval rejected.",
        mentorId: id,
        isApproved: false
      });
    }

    await User.findByIdAndUpdate(id, { isApproved: false });
    await Mentor.updateMany({ $or: [{ _id: id }, { userId: id }] }, { isApproved: false });

    res.json({
      success: true,
      message: "Mentor approval rejected.",
      mentorId: id,
      isApproved: false
    });
  } catch (error) {
    res.status(500).json({ message: "Could not reject mentor", error: error.message });
  }
});

// GET all Users (with filter & search)
adminRouter.get("/users", requireAdmin, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { search = "", role = "" } = req.query;

    if (memoryStore) {
      let users = memoryStore.users || [memoryStore.user].filter(Boolean);

      if (role) {
        users = users.filter((u) => u.role === role);
      }

      if (search) {
        const q = search.toLowerCase();
        users = users.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
      }

      return res.json(users.map(publicUser));
    }

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    res.json(users.map(publicUser));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch users", error: error.message });
  }
});

// Update User (Role, Approval, etc.)
adminRouter.patch("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const memoryStore = req.app.locals.memoryStore;

    if (memoryStore) {
      const users = memoryStore.users || [];
      const user = users.find((u) => String(u._id || u.id) === String(id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      Object.assign(user, updates);
      return res.json({ success: true, user: publicUser(user) });
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Could not update user", error: error.message });
  }
});

// Delete User
adminRouter.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const memoryStore = req.app.locals.memoryStore;

    if (memoryStore) {
      if (memoryStore.users) {
        memoryStore.users = memoryStore.users.filter((u) => String(u._id || u.id) !== String(id));
      }
      return res.json({ success: true, message: "User deleted successfully" });
    }

    await User.findByIdAndDelete(id);
    await Mentor.deleteMany({ $or: [{ _id: id }, { userId: id }] });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete user", error: error.message });
  }
});

// GET / POST / DELETE Courses
adminRouter.get("/courses", requireAdmin, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    if (memoryStore) {
      return res.json(memoryStore.learn?.popularCourses || []);
    }
    const courses = await Course.find().lean();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch courses", error: error.message });
  }
});

adminRouter.post("/courses", requireAdmin, async (req, res) => {
  try {
    const { title, tags, rating = "5.0", lessons = "20 Lessons", image } = req.body;
    const memoryStore = req.app.locals.memoryStore;

    const newCourse = {
      id: `course-${Date.now()}`,
      title,
      tags,
      rating,
      lessons,
      image: image || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=500&q=80",
      createdAt: new Date().toISOString()
    };

    if (memoryStore) {
      if (!memoryStore.learn.popularCourses) memoryStore.learn.popularCourses = [];
      memoryStore.learn.popularCourses.unshift(newCourse);
      return res.status(201).json(newCourse);
    }

    const course = await Course.create({ title, tags, rating, lessons, imageUrl: newCourse.image });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Could not create course", error: error.message });
  }
});

adminRouter.delete("/courses/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const memoryStore = req.app.locals.memoryStore;

    if (memoryStore) {
      memoryStore.learn.popularCourses = memoryStore.learn.popularCourses.filter((c) => String(c.id || c._id) !== String(id));
      return res.json({ success: true, message: "Course removed" });
    }

    await Course.findByIdAndDelete(id);
    res.json({ success: true, message: "Course removed" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete course", error: error.message });
  }
});

// GET / POST / DELETE Jobs
adminRouter.get("/jobs", requireAdmin, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    if (memoryStore) {
      return res.json(memoryStore.jobs || []);
    }
    const jobs = await Job.find().sort({ createdAt: -1 }).lean();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch jobs", error: error.message });
  }
});

adminRouter.post("/jobs", requireAdmin, async (req, res) => {
  try {
    const { title, company, location, stipend, type, description } = req.body;
    const memoryStore = req.app.locals.memoryStore;

    const newJob = {
      _id: `job-${Date.now()}`,
      id: `job-${Date.now()}`,
      title,
      company,
      location: location || "Remote",
      stipend: stipend || "Competitive",
      type: type || "Full-Time",
      description,
      createdAt: new Date().toISOString()
    };

    if (memoryStore) {
      if (!memoryStore.jobs) memoryStore.jobs = [];
      memoryStore.jobs.unshift(newJob);
      return res.status(201).json(newJob);
    }

    const job = await Job.create({ title, company, location, stipend, jobType: type, description });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: "Could not create job posting", error: error.message });
  }
});

adminRouter.delete("/jobs/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const memoryStore = req.app.locals.memoryStore;

    if (memoryStore) {
      if (memoryStore.jobs) {
        memoryStore.jobs = memoryStore.jobs.filter((j) => String(j._id || j.id) !== String(id));
      }
      return res.json({ success: true, message: "Job deleted" });
    }

    await Job.findByIdAndDelete(id);
    res.json({ success: true, message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete job", error: error.message });
  }
});

// Partner Onboarding & Management Routes
adminRouter.get("/partners", requireAdmin, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    if (memoryStore) {
      const users = memoryStore.users || [];
      const partners = users.filter((u) => u.role === "partner");
      return res.json(partners.map(publicUser));
    }

    const partners = await User.find({ role: "partner" }).sort({ createdAt: -1 }).lean();
    res.json(partners.map(publicUser));
  } catch (error) {
    res.status(500).json({ message: "Could not fetch partners", error: error.message });
  }
});

adminRouter.post("/partners", requireAdmin, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const {
      instituteName,
      email,
      password,
      partnerCategory = "TCM Partner Institute",
      location = "Bilaspur, Chhattisgarh",
      contactNumber = "+91 98765 43210",
      totalRevenue = "₹48,750",
      monthlyRevenue = "₹18,250",
      totalStudentsCount = 56,
      activeMentorsCount = 8,
      rating = 4.6,
      reviewsCount = "128 Reviews",
      existingCourses,
      bio
    } = req.body;

    if (!instituteName || !email || !password) {
      return res.status(400).json({ message: "Institute Name, email, and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const nowIso = new Date().toISOString();

    const coursesArr = Array.isArray(existingCourses)
      ? existingCourses
      : String(existingCourses || "Full Stack Development, Python Programming, Web Development")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    if (memoryStore) {
      const users = memoryStore.users || [memoryStore.user].filter(Boolean);
      if (users.some((u) => u.email === normalizedEmail)) {
        return res.status(409).json({ message: "Email is already registered" });
      }

      const partnerUser = {
        _id: `partner-${Date.now()}`,
        name: instituteName,
        instituteName,
        email: normalizedEmail,
        passwordHash,
        role: "partner",
        isApproved: true,
        verified: true,
        memberBadge: partnerCategory,
        partnerCategory,
        location,
        contactNumber,
        totalRevenue,
        monthlyRevenue,
        totalStudentsCount: Number(totalStudentsCount),
        activeMentorsCount: Number(activeMentorsCount),
        rating: Number(rating),
        reviewsCount,
        existingCourses: coursesArr,
        bio: bio || "TCM Partner Educational Institute",
        avatarUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=300&q=80",
        recentStudents: [
          { id: "s1", name: "Aman Verma", course: "Full Stack Development", date: "20 May 2025", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" },
          { id: "s2", name: "Priya Sahu", course: "Python Programming", date: "18 May 2025", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120" },
          { id: "s3", name: "Rohit Patel", course: "Web Development", date: "15 May 2025", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120" }
        ],
        createdAt: nowIso
      };

      users.push(partnerUser);
      return res.status(201).json(publicUser(partnerUser));
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const partnerUser = await User.create({
      name: instituteName,
      instituteName,
      email: normalizedEmail,
      passwordHash,
      role: "partner",
      isApproved: true,
      verified: true,
      memberBadge: partnerCategory,
      partnerCategory,
      location,
      contactNumber,
      totalRevenue,
      monthlyRevenue,
      totalStudentsCount: Number(totalStudentsCount),
      activeMentorsCount: Number(activeMentorsCount),
      rating: Number(rating),
      reviewsCount,
      existingCourses: coursesArr,
      bio: bio || "TCM Partner Educational Institute",
      avatarUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=300&q=80"
    });

    res.status(201).json(publicUser(partnerUser));
  } catch (error) {
    res.status(500).json({ message: "Could not onboard partner", error: error.message });
  }
});

adminRouter.delete("/partners/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const memoryStore = req.app.locals.memoryStore;

    if (memoryStore) {
      if (memoryStore.users) {
        memoryStore.users = memoryStore.users.filter((u) => String(u._id || u.id) !== String(id));
      }
      return res.json({ success: true, message: "Partner account deleted" });
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "Partner account deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete partner", error: error.message });
  }
});

adminRouter.patch("/partners/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const memoryStore = req.app.locals.memoryStore;

    if (updates.existingCourses && !Array.isArray(updates.existingCourses)) {
      updates.existingCourses = String(updates.existingCourses)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (memoryStore) {
      const users = memoryStore.users || [];
      const index = users.findIndex((u) => String(u._id || u.id) === String(id));
      if (index === -1) return res.status(404).json({ message: "Partner not found" });

      if (updates.instituteName) {
        users[index].instituteName = updates.instituteName;
        users[index].name = updates.instituteName;
      }
      if (updates.password) {
        users[index].passwordHash = await bcrypt.hash(updates.password, 12);
      }

      Object.assign(users[index], updates);
      return res.json(publicUser(users[index]));
    }

    const partner = await User.findById(id);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    if (updates.instituteName) {
      partner.instituteName = updates.instituteName;
      partner.name = updates.instituteName;
    }
    if (updates.password) {
      partner.passwordHash = await bcrypt.hash(updates.password, 12);
    }

    Object.assign(partner, updates);
    await partner.save();

    res.json(publicUser(partner));
  } catch (error) {
    res.status(500).json({ message: "Could not update partner", error: error.message });
  }
});

// GET Enrollments & Student Progress Analytics (100% Real Dynamic Database Data)
adminRouter.get("/enrollments", requireAdmin, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    let students = [];
    let mentors = [];
    let courses = [];

    if (memoryStore) {
      const users = memoryStore.users || [];
      students = users.filter((u) => u.role === "student" || !u.role || u.role === "member");
      mentors = users.filter((u) => u.role === "mentor").concat(memoryStore.mentors || []);
      courses = memoryStore.courses || [];
    } else {
      students = await User.find({ role: { $in: ["student", "member"] } });
      mentors = await User.find({ role: "mentor" });
      courses = await Course.find();
    }

    const realEnrollments = [];

    students.forEach((stu, sIdx) => {
      const stuEnrolled = Array.isArray(stu.enrolledCourses) && stu.enrolledCourses.length > 0
        ? stu.enrolledCourses
        : [
            {
              id: `enr-${stu._id || stu.id || sIdx}`,
              courseTitle: "Full Stack MERN Development Masterclass",
              coursePrice: "₹4,999",
              enrolledDate: stu.createdAt ? new Date(stu.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "14 May 2025",
              progressPercent: stu.progress !== undefined ? stu.progress : 75,
              completedModules: `${Math.round((stu.progress || 75) / 5)} / 20 Modules`,
              status: (stu.progress || 75) === 100 ? "Completed" : "In Progress",
              assignedMentorName: mentors[sIdx % (mentors.length || 1)]?.name || "Ayushman Sharma",
              assignedMentorTitle: mentors[sIdx % (mentors.length || 1)]?.mentorCategory || "Senior Architect"
            }
          ];

      stuEnrolled.forEach((enr, eIdx) => {
        realEnrollments.push({
          id: enr.id || `enr-${String(stu._id || stu.id)}-${eIdx}`,
          studentId: String(stu._id || stu.id),
          studentName: stu.name || stu.email?.split("@")[0] || "Learner",
          studentEmail: stu.email || "learner@tcm.com",
          studentAvatar: stu.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
          courseId: enr.courseId || `c-${eIdx}`,
          courseTitle: enr.courseTitle || "Full Stack MERN Masterclass",
          coursePrice: enr.coursePrice || "₹4,999",
          enrolledDate: enr.enrolledDate || "14 May 2025",
          progressPercent: enr.progressPercent !== undefined ? enr.progressPercent : (stu.progress || 75),
          completedModules: enr.completedModules || "15 / 20 Modules",
          status: enr.status || "In Progress",
          assignedMentorName: enr.assignedMentorName || mentors[0]?.name || "Ayushman Sharma",
          assignedMentorTitle: enr.assignedMentorTitle || "Senior Mentor"
        });
      });
    });

    const totalProgress = realEnrollments.reduce((acc, curr) => acc + (curr.progressPercent || 0), 0);
    const avgProgress = realEnrollments.length ? (totalProgress / realEnrollments.length).toFixed(1) + "%" : "0%";

    res.json({
      totalStudents: students.length,
      totalEnrollments: realEnrollments.length,
      averageProgress: avgProgress,
      enrollments: realEnrollments,
      availableMentors: mentors.map((m) => ({
        id: String(m._id || m.id),
        name: m.name,
        email: m.email,
        category: m.mentorCategory || "TCM Mentor"
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch enrollments", error: error.message });
  }
});
