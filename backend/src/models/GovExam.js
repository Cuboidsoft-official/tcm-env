import mongoose from "mongoose";

const govExamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    category: {
      type: String,
      required: true,
      enum: ["SSC", "Railway", "Banking", "UPSC", "State PSC", "Police", "Teaching", "Defence", "Other"],
      default: "SSC"
    },
    description: {
      type: String,
      default: ""
    },
    logo: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const GovExam = mongoose.model("GovExam", govExamSchema);
