import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, min: 0, required: true },
    currency: { type: String, default: "INR" },
    payoutMethod: { type: String, default: "upi" },
    payoutDestination: { type: String, required: true, select: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    adminNote: String,
    processedAt: Date
  },
  { timestamps: true }
);

withdrawalSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Withdrawal = mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);
