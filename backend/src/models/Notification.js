import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    audienceRole: String,
    title: { type: String, required: true },
    body: String,
    icon: String,
    clickUrl: String,
    readAt: Date
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
