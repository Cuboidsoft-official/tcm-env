import mongoose from "mongoose";

const outboxEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    aggregateType: { type: String, required: true, index: true },
    aggregateId: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["pending", "processing", "published", "failed"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    availableAt: { type: Date, default: Date.now, index: true },
    publishedAt: Date,
    lastError: String
  },
  { timestamps: true }
);

outboxEventSchema.index({ status: 1, availableAt: 1 });

export const OutboxEvent = mongoose.models.OutboxEvent || mongoose.model("OutboxEvent", outboxEventSchema);
