import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", index: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", index: true },
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    enrollmentType: { type: String, enum: ["course", "program"], default: "course" },
    sourceOrderLegacyId: Number,
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ["pending", "active", "completed", "expired", "cancelled"], default: "active", index: true },
    enrolledAt: Date,
    expiresAt: Date,
    completedAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true, partialFilterExpression: { courseId: { $exists: true } } });
enrollmentSchema.index({ userId: 1, programId: 1 }, { unique: true, partialFilterExpression: { programId: { $exists: true } } });
enrollmentSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1, enrollmentType: 1 }, { unique: true, sparse: true });

export const Enrollment = mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
