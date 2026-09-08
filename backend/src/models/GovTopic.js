import mongoose from "mongoose";

const govTopicSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovSubject",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

govTopicSchema.index({ subjectId: 1, name: 1 }, { unique: true });

export const GovTopic = mongoose.model("GovTopic", govTopicSchema);
