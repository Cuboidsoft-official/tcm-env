import mongoose from "mongoose";

const govSubjectSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovExam",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      default: ""
    },
    icon: {
      type: String,
      default: "book-open"
    }
  },
  { timestamps: true }
);

govSubjectSchema.index({ examId: 1, name: 1 }, { unique: true });

export const GovSubject = mongoose.model("GovSubject", govSubjectSchema);
