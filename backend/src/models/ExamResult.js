import mongoose from "mongoose";

const ExamResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    certId: {
      type: String,
      default: ""
    },
    examTitle: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: "General"
    },
    subSkill: {
      type: String,
      default: "General"
    },
    score: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 10
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    grade: {
      type: String,
      default: "Passed"
    },
    timeTakenSeconds: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const ExamResult = mongoose.model("ExamResult", ExamResultSchema);
