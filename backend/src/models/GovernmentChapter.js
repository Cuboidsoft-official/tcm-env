import mongoose from "mongoose";

const governmentChapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleHi: { type: String, default: "" },
    examId: { type: String, required: true, index: true },
    examName: { type: String, required: true },
    subjectId: { type: String, required: true, index: true },
    subjectName: { type: String, required: true },
    topicId: { type: String, default: "", index: true },
    topicName: { type: String, default: "General" },
    state: { type: String, default: "All States", index: true },
    language: { type: String, enum: ["en", "hi", "hinglish"], default: "en" },
    content: { type: String, required: true },
    contentHi: { type: String, default: "" },
    tableOfContents: [
      {
        id: { type: String },
        title: { type: String },
        anchor: { type: String }
      }
    ],
    estimatedReadingTime: { type: Number, default: 12 },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "GovernmentSource", default: null },
    sourceUrl: { type: String, default: "" },
    sourceName: { type: String, default: "Official Curriculum Board" },
    license: { type: String, default: "Open Educational Resource / Verified Academic Material" },
    commercialReusePermitted: { type: Boolean, default: true },
    contentVersion: { type: Number, default: 1 },
    documentHash: { type: String, default: "" },
    publishedAt: { type: Date, default: Date.now },
    fetchedAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "source_unavailable", "license_review_required"],
      default: "approved",
      index: true
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const GovernmentChapter = mongoose.model("GovernmentChapter", governmentChapterSchema);
