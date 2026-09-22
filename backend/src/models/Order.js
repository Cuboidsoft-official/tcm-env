import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    itemType: { type: String, enum: ["course", "event", "program", "other"], required: true },
    itemLegacyId: Number,
    itemTitle: String,
    amount: { type: Number, min: 0, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], index: true },
    paymentMethod: String,
    paymentReference: String
  },
  { timestamps: true }
);

orderSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
