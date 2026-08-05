import mongoose from "mongoose";

const KnowledgeBaseItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      default: () => `KB-${Date.now()}`
    },
    roomId: {
      type: String
    },
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: "General"
    },
    questionText: {
      type: String,
      required: true
    },
    solutionText: {
      type: String,
      required: true
    },
    authorName: {
      type: String,
      default: "Student"
    },
    solvedByMentorName: {
      type: String,
      default: "Rahul Sharma"
    },
    upvotes: {
      type: Number,
      default: 12
    }
  },
  { timestamps: true }
);

export const KnowledgeBaseItem = mongoose.models.KnowledgeBaseItem || mongoose.model("KnowledgeBaseItem", KnowledgeBaseItemSchema);
