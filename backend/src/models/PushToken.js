import mongoose from "mongoose";

const pushTokenSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, default: "android" },
    registeredAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const PushToken = mongoose.model("PushToken", pushTokenSchema);
