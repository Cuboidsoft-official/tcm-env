import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    avatarUrl: String,
    icon: String,
    iconColor: String,
    backgroundColor: String,
    ringColors: {
      type: [String],
      default: ["#6E42F5", "#7D45EA"]
    },
    badge: {
      type: String,
      enum: ["add", "live", "none"],
      default: "none"
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const Story = mongoose.model("Story", storySchema);
