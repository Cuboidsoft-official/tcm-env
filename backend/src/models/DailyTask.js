import mongoose from "mongoose";

const dailyTaskSchema = new mongoose.Schema(
  {
    legacyIds: { mysql: Number }, sourceSystem: { type: String, default: "app" }, migrationBatchId: { type: String, index: true }, schemaVersion: { type: Number, default: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", index: true },
    courseTitle: String, title: { type: String, required: true }, description: String,
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    estimatedMinutes: { type: Number, min: 0, default: 30 }, tags: [String], motivation: String,
    status: { type: String, enum: ["pending", "in_progress", "completed", "skipped"], default: "pending", index: true },
    completedAt: Date, weekStart: { type: Date, required: true, index: true }, generatedAt: Date, notifiedAt: Date
  },
  { timestamps: true }
);

dailyTaskSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const DailyTask = mongoose.models.DailyTask || mongoose.model("DailyTask", dailyTaskSchema);
