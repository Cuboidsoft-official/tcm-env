import mongoose from "mongoose";

const governmentLearningProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    chapterId: { type: String, required: true, index: true },
    examId: { type: String, default: "" },
    subjectId: { type: String, default: "" },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    isCompleted: { type: Boolean, default: false },
    lastPosition: { type: Number, default: 0 },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

governmentLearningProgressSchema.index({ userId: 1, chapterId: 1 }, { unique: true });

export const GovernmentLearningProgress = mongoose.model("GovernmentLearningProgress", governmentLearningProgressSchema);
