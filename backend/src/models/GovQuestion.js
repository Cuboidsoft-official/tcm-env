import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const govQuestionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovExam",
      required: true
    },
    examName: {
      type: String,
      default: ""
    },
    year: {
      type: Number,
      required: true,
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovSubject",
      required: true
    },
    subjectName: {
      type: String,
      default: ""
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GovTopic"
    },
    topicName: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      enum: ["pyq", "practice", "mock"],
      default: "pyq",
      index: true
    },
    questionText: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      type: [optionSchema],
      required: true
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true
    },
    explanation: {
      type: String,
      default: ""
    },
    language: {
      type: String,
      enum: ["en", "hi", "hinglish"],
      default: "en"
    },
    state: {
      type: String,
      default: "All",
      index: true
    },
    source: {
      type: String,
      default: "licensed_dataset"
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

govQuestionSchema.index({ examId: 1, year: 1, state: 1, subjectId: 1, topicId: 1, type: 1 });
govQuestionSchema.index({ examId: 1, year: 1 });

export const GovQuestion = mongoose.model("GovQuestion", govQuestionSchema);
