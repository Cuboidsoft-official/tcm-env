import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    itemType: { type: String, enum: ["course", "program", "event", "other"] },
    itemLegacyId: Number,
    itemTitle: String,
    amount: { type: Number, min: 0, required: true },
    currency: { type: String, default: "INR" },
    transactionReference: { type: String, index: true },
    method: String,
    paymentDate: Date,
    evidencePath: { type: String, select: false },
    referralCode: String,
    referrerLegacyId: Number,
    evidenceFileId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadedMedia" },
    status: { type: String, enum: ["pending", "approved", "rejected", "refunded"], default: "pending", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    rejectionReason: String,
    adminNote: { type: String, select: false },
    receiptNumber: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

paymentSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
