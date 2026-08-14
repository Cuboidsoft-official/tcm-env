import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["student", "mentor", "admin", "partner"],
      default: "student"
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    mentorCategory: {
      type: String,
      default: "TCM One Information Tech"
    },
    instituteName: {
      type: String,
      default: "Future Tech Institute"
    },
    partnerCategory: {
      type: String,
      default: "TCM One Partner Institute"
    },
    contactNumber: {
      type: String,
      default: "+91 98765 43210"
    },
    totalRevenue: {
      type: String,
      default: "₹48,750"
    },
    monthlyRevenue: {
      type: String,
      default: "₹18,250"
    },
    totalStudentsCount: {
      type: Number,
      default: 56
    },
    activeMentorsCount: {
      type: Number,
      default: 8
    },
    rating: {
      type: Number,
      default: 4.6
    },
    reviewsCount: {
      type: String,
      default: "128 Reviews"
    },
    existingCourses: {
      type: Array,
      default: ["Full Stack Development", "Python Programming", "Web Development"]
    },
    galleryPhotos: {
      type: Array,
      default: []
    },
    recentStudents: {
      type: Array,
      default: [
        { id: "s1", name: "Aman Verma", course: "Full Stack Development", date: "20 May 2025", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" },
        { id: "s2", name: "Priya Sahu", course: "Python Programming", date: "18 May 2025", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120" },
        { id: "s3", name: "Rohit Patel", course: "Web Development", date: "15 May 2025", status: "Active", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120" }
      ]
    },
    avatarUrl: String,
    handle: {
      type: String,
      default: "ayushman"
    },
    verified: {
      type: Boolean,
      default: true
    },
    memberBadge: {
      type: String,
      default: "TCM One Member"
    },
    bio: {
      type: String,
      default: "Building TCM One to help curious minds learn, grow & create impact."
    },
    location: {
      type: String,
      default: "India"
    },
    city: {
      type: String,
      default: "Bilaspur"
    },
    gmbLink: {
      type: String,
      default: ""
    },
    heroCover: {
      type: String,
      default: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"
    },
    labFee: {
      type: String,
      default: "₹0 - ₹100 /hr"
    },
    timings: {
      type: String,
      default: "9:00 AM - 8:00 PM"
    },
    joinedDate: {
      type: String,
      default: "Joined Jan 2024"
    },
    website: {
      type: String,
      default: "thecodemunk.in"
    },
    yearsExperience: {
      type: String,
      default: "5+ Yrs Exp"
    },
    subjects: {
      type: Array,
      default: ["Full Stack Development", "React Native", "Node.js & MongoDB", "System Design"]
    },
    experiences: {
      type: Array,
      default: [
        { id: "exp1", role: "Senior Software Engineer & Mentor", company: "TCM One Academy", durationPill: "3+ Years", icon: "school", iconColor: "#5B3CF5" }
      ]
    },
    certifications: {
      type: Array,
      default: ["Certified Technical Instructor", "Full Stack Systems Architect"]
    },
    interests: {
      type: Array,
      default: ["System Architecture", "AI & Machine Learning", "Student Mentorship"]
    },
    skills: {
      type: Array,
      default: []
    },
    savedPosts: [{ type: String }],
    stats: {
      postsCount: { type: Number, default: 0 },
      followers: { type: String, default: "0" },
      following: { type: Number, default: 0 },
      reputation: { type: String, default: "0" }
    },
    quickTools: {
      savedCount: { type: Number, default: 0 },
      draftsCount: { type: Number, default: 0 },
      deletedCount: { type: Number, default: 0 }
    },
    progress: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    friends: {
      type: [String],
      default: []
    },
    friendRequests: {
      type: Array,
      default: []
    },
    referredBy: {
      type: String,
      default: ""
    },
    referralAppliedAt: {
      type: Date
    },
    enrolledCourses: {
      type: Array,
      default: [
        {
          id: "enr-101",
          courseId: "c1",
          courseTitle: "Full Stack MERN Development Masterclass",
          coursePrice: "₹4,999",
          enrolledDate: "14 May 2025",
          progressPercent: 85,
          completedModules: "17 / 20 Modules",
          status: "In Progress",
          assignedMentorName: "Ayushman Sharma",
          assignedMentorTitle: "Senior Full Stack Architect"
        }
      ]
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
