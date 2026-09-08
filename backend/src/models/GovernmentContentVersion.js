import mongoose from "mongoose";

const governmentContentVersionSchema = new mongoose.Schema(
  {
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "GovernmentChapter", required: true },
    versionNumber: { type: Number, required: true },
    content: { type: String, required: true },
    documentHash: { type: String, required: true },
    changeSummary: { type: String, default: "Updated study material content." },
    updatedBy: { type: String, default: "system_sync" },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const GovernmentContentVersion = mongoose.model("GovernmentContentVersion", governmentContentVersionSchema);
