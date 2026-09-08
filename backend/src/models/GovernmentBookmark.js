import mongoose from "mongoose";

const governmentBookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    chapterId: { type: String, required: true, index: true },
    chapterTitle: { type: String, default: "" },
    subjectName: { type: String, default: "" },
    examName: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

governmentBookmarkSchema.index({ userId: 1, chapterId: 1 }, { unique: true });

export const GovernmentBookmark = mongoose.model("GovernmentBookmark", governmentBookmarkSchema);
