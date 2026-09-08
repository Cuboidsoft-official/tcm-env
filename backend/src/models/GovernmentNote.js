import mongoose from "mongoose";

const governmentNoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    chapterId: { type: String, required: true, index: true },
    noteText: { type: String, required: true },
    highlightColor: { type: String, default: "#FEF08A" },
    highlightText: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const GovernmentNote = mongoose.model("GovernmentNote", governmentNoteSchema);
