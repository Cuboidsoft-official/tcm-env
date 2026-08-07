import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      trim: true
    },
    creatorId: {
      type: String,
      required: true,
      trim: true
    },
    creatorName: {
      type: String,
      required: true,
      trim: true
    },
    creatorRole: {
      type: String,
      default: "TCM Mentor"
    },
    creatorAvatarUrl: String,
    privacy: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    },
    category: {
      type: String,
      default: "General"
    },
    description: {
      type: String,
      trim: true
    },
    coverImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
    },
    membersCount: {
      type: Number,
      default: 1
    },
    postsCount: {
      type: Number,
      default: 0
    },
    members: [
      {
        type: String
      }
    ]
  },
  { timestamps: true }
);

export const Community = mongoose.model("Community", communitySchema);
