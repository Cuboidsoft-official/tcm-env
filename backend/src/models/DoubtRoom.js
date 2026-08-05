import mongoose from "mongoose";

const DoubtRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      default: () => `ROOM-${Date.now()}`
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: "NEET" // "NEET", "JEE", "Full Stack", "Python & AI"
    },
    creatorId: {
      type: String,
      required: true
    },
    creatorRole: {
      type: String,
      enum: ["mentor", "student"],
      default: "student"
    },
    assignedMentor: {
      id: { type: String, default: "m1" },
      name: { type: String, default: "Rahul Sharma" },
      role: { type: String, default: "Chemistry Expert & Lead Mentor" },
      avatarUrl: {
        type: String,
        default: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      },
      online: { type: Boolean, default: true }
    },
    membersCount: {
      type: Number,
      default: 1285
    },
    onlineCount: {
      type: Number,
      default: 86
    },
    pinnedAnnouncement: {
      text: {
        type: String,
        default: "Please use this group only for NEET related doubts."
      },
      authorName: {
        type: String,
        default: "Admin"
      }
    },
    isSolved: {
      type: Boolean,
      default: false
    },
    solvedAnswerId: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export const DoubtRoom = mongoose.models.DoubtRoom || mongoose.model("DoubtRoom", DoubtRoomSchema);
