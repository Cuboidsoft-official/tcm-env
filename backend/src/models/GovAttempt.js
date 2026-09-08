import mongoose from "mongoose";

const govAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovQuestion",
      required: true,
      index: true
    },
    examId: String,
    examName: String,
    subjectId: String,
    subjectName: String,
    selectedAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeTaken: {
      type: Number,
      default: 0
    },
    attemptedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

govAttemptSchema.index({ userId: 1, questionId: 1 });

export const GovAttempt = mongoose.model("GovAttempt", govAttemptSchema);
