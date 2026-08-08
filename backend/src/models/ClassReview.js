import mongoose from "mongoose";

const classReviewSchema = new mongoose.Schema(
  {
    classId: {
      type: String,
      default: "lc1"
    },
    courseId: {
      type: String,
      default: "c1"
    },
    className: {
      type: String,
      required: true,
      default: "Full Stack Web Development - Day 1"
    },
    mentorId: {
      type: String,
      required: true
    },
    mentorName: {
      type: String,
      default: "TCM Mentor"
    },
    mentorAvatar: {
      type: String,
      default: ""
    },
    studentId: {
      type: String,
      required: true
    },
    studentName: {
      type: String,
      required: true,
      default: "Learner"
    },
    studentAvatar: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      enum: ["mentor_feedback", "student_reflection"],
      default: "mentor_feedback"
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5
    },
    answeredQuestions: {
      type: String,
      enum: ["Yes", "Partially", "No"],
      default: "Yes"
    },
    activeStatus: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "High"
    },
    askedQuestions: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes"
    },
    comment: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export const ClassReview = mongoose.model("ClassReview", classReviewSchema);
