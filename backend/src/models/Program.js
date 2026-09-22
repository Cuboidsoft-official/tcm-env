import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, index: true },
    subtitle: String,
    description: String,
    type: { type: String, index: true },
    icon: String,
    thumbnail: String,
    level: String,
    mode: String,
    duration: String,
    schedule: String,
    price: { type: Number, min: 0, default: 0 },
    originalPrice: { type: Number, min: 0 },
    totalSeats: { type: Number, min: 0, default: 0 },
    seatsLeft: { type: Number, min: 0, default: 0 },
    highlights: [String],
    startDate: Date,
    endDate: Date,
    isFeatured: { type: Boolean, default: false },
    publicationStatus: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
  },
  { timestamps: true }
);

programSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Program = mongoose.models.Program || mongoose.model("Program", programSchema);
