import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    description: String,
    category: { type: String, index: true },
    accessType: { type: String, enum: ["free", "paid"], default: "free" },
    status: { type: String, enum: ["upcoming", "ongoing", "past"], default: "upcoming", index: true },
    price: { type: Number, min: 0, default: 0 },
    eventDate: Date,
    eventTime: String,
    mode: { type: String, enum: ["online", "offline"], default: "online" },
    location: String,
    banner: String,
    totalSeats: { type: Number, min: 0, default: 0 },
    seatsFilled: { type: Number, min: 0, default: 0 },
    recordingUrl: String
  },
  { timestamps: true }
);

eventSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
