import mongoose from "mongoose";

const governmentSourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: { type: String, enum: ["official_portal", "recruitment_board", "ncert", "epathshala", "diksha", "admin_upload"], default: "official_portal" },
    apiUrl: { type: String, default: "" },
    fetchMethod: { type: String, enum: ["rss", "api", "pdf_extract", "manual"], default: "api" },
    supportedStates: [{ type: String }],
    supportedExams: [{ type: String }],
    supportedLanguages: [{ type: String, default: ["en", "hi"] }],
    licenseInfo: { type: String, default: "Public Government Document / Open Access" },
    commercialReusePermission: { type: Boolean, default: false },
    syncFrequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "weekly" },
    lastSuccessfulSync: { type: Date, default: null },
    lastFailedSync: { type: Date, default: null },
    status: { type: String, enum: ["active", "inactive", "error", "license_review"], default: "active" }
  },
  { timestamps: true }
);

export const GovernmentSource = mongoose.model("GovernmentSource", governmentSourceSchema);
