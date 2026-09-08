import mongoose from "mongoose";

const govAiExplanationSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovQuestion",
      required: true,
      index: true
    },
    language: {
      type: String,
      default: "en",
      index: true
    },
    shortExplanation: String,
    detailedExplanation: String,
    keyConcept: String,
    examTip: String,
    rawResponse: String
  },
  { timestamps: true }
);

govAiExplanationSchema.index({ questionId: 1, language: 1 }, { unique: true });

export const GovAiExplanation = mongoose.model("GovAiExplanation", govAiExplanationSchema);
