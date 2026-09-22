import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    legacyIds: { mysql: Number },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    interestType: String,
    interestLegacyId: Number,
    interestTitle: String,
    message: String,
    acquisitionSource: { type: String, default: "website", index: true },
    status: { type: String, enum: ["new", "contacted", "converted", "lost"], default: "new", index: true },
    whatsappSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

leadSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
