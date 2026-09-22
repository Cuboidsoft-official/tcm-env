import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, index: true },
    description: String,
    icon: String,
    audience: { type: String, default: "general" },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true }
  },
  { timestamps: true }
);

categorySchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
