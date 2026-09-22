import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    currency: { type: String, default: "INR" },
    balance: { type: Number, min: 0, default: 0 },
    pendingBalance: { type: Number, min: 0, default: 0 },
    lastReconciledAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

walletSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
