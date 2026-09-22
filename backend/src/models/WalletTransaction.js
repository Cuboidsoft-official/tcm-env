import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    type: { type: String, enum: ["credit", "debit", "hold", "release", "adjustment"], required: true },
    amount: { type: Number, min: 0, required: true },
    balanceAfter: { type: Number, min: 0 },
    referenceType: String,
    referenceId: String,
    description: String,
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const WalletTransaction = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);
