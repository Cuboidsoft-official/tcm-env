import mongoose from "mongoose";

const pushTokenSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, default: "android" },
    registeredAt: { type: Date, default: Date.now },
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    lastSeenAt: Date,
    invalidatedAt: Date,
    invalidationReason: String
  },
  { timestamps: true }
);

pushTokenSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const PushToken = mongoose.model("PushToken", pushTokenSchema);
