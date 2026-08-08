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
      enum: ["student", "mentor", "admin"],
      default: "student"
    },
    mentorCategory: {
      type: String,
      default: "TCM Information Tech"
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
      default: "TCM Member"
    },
    bio: {
      type: String,
      default: "Building TCM to help curious minds learn, grow & create impact."
    },
    location: {
      type: String,
      default: "India"
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
        { id: "exp1", role: "Senior Software Engineer & Mentor", company: "TCM Academy", durationPill: "3+ Years", icon: "school", iconColor: "#5B3CF5" }
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
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
