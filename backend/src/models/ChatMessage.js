import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    pairKey: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: String,
      required: true
    },
    senderName: {
      type: String,
      default: "Learner"
    },
    senderAvatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
    },
    text: {
      type: String,
      default: ""
    },
    mediaType: String,
    mediaUrl: String,
    driveLink: String,
    fileName: String,
    time: String,
    timestamp: {
      type: Number,
      default: Date.now
    },
    isMentor: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
