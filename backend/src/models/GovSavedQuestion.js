import mongoose from "mongoose";

const govSavedQuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovQuestion",
      required: true
    }
  },
  { timestamps: true }
);

govSavedQuestionSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export const GovSavedQuestion = mongoose.model("GovSavedQuestion", govSavedQuestionSchema);
