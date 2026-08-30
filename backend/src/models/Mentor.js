import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      default: "Last Class Educator"
    },
    mentorCategory: {
      type: String,
      default: "Last Class Tech"
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 5.0
    },
    reviewsCount: {
      type: String,
      default: "1"
    },
    learners: {
      type: String,
      default: "1.2K+"
    },
    avatarUrl: String,
    skills: [String],
    subjects: [mongoose.Schema.Types.Mixed],
    experiences: [mongoose.Schema.Types.Mixed],
    certifications: [mongoose.Schema.Types.Mixed],
    interests: [mongoose.Schema.Types.Mixed],
    bio: String
  },
  { timestamps: true }
);

export const Mentor = mongoose.model("Mentor", mentorSchema);
