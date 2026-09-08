import mongoose from "mongoose";

const governmentSyncLogSchema = new mongoose.Schema(
  {
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "GovernmentSource", required: true },
    sourceName: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    status: { type: String, enum: ["success", "failed", "partial", "license_blocked"], required: true },
    itemsFetched: { type: Number, default: 0 },
    itemsApproved: { type: Number, default: 0 },
    itemsPending: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
    executedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const GovernmentSyncLog = mongoose.model("GovernmentSyncLog", governmentSyncLogSchema);
