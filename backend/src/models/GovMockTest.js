import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: String,
      default: ""
    },
    subjectName: {
      type: String,
      required: true
    },
    totalQuestions: {
      type: Number,
      default: 25
    },
    marksPerQuestion: {
      type: Number,
      default: 2.0
    },
    negativeMarks: {
      type: Number,
      default: 0.5
    }
  },
  { _id: false }
);

const govMockTestSchema = new mongoose.Schema(
  {
    examId: {
      type: String,
      required: true,
      index: true
    },
    examName: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    testType: {
      type: String,
      enum: ["full", "subject", "topic", "pyq", "custom"],
      default: "full",
      index: true
    },
    tier: {
      type: String,
      default: "Tier 1"
    },
    durationMins: {
      type: Number,
      default: 60
    },
    totalQuestions: {
      type: Number,
      default: 100
    },
    maxMarks: {
      type: Number,
      default: 200
    },
    negativeMarking: {
      type: Number,
      default: 0.5
    },
    positiveMarks: {
      type: Number,
      default: 2.0
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Mixed"],
      default: "Mixed"
    },
    languages: {
      type: [String],
      default: ["English", "Hindi"]
    },
    sections: [sectionSchema],
    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GovQuestion"
      }
    ],
    attemptCount: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

govMockTestSchema.index({ examId: 1, testType: 1, isPublished: 1 });

export const GovMockTest = mongoose.model("GovMockTest", govMockTestSchema);
