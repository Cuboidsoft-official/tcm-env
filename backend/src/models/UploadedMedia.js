import mongoose from "mongoose";

const uploadedMediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true, index: true },
    mimeType: { type: String, required: true },
    data: { type: Buffer, required: true }
  },
  { timestamps: true }
);

export const UploadedMedia = mongoose.models.UploadedMedia || mongoose.model("UploadedMedia", uploadedMediaSchema);
