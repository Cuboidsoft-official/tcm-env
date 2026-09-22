import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    college: String,
    skills: [String],
    motivation: String,
    portfolioUrl: String,
    resumePath: { type: String, select: false },
    status: { type: String, enum: ["submitted", "under_review", "shortlisted", "selected", "rejected"], default: "submitted", index: true },
    notes: { type: String, select: false },
    reviewedAt: Date
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, programId: 1 }, { unique: true });
applicationSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);
