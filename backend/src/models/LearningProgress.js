import mongoose from "mongoose";

const learningProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lessonId: { type: String, required: true, index: true },
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "in_progress" },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    startedAt: Date,
    completedAt: Date,
    lastViewedAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

learningProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });
learningProgressSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const LearningProgress = mongoose.models.LearningProgress || mongoose.model("LearningProgress", learningProgressSchema);
