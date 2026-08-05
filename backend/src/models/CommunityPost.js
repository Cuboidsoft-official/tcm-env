import mongoose from "mongoose";

const communityPostSchema = new mongoose.Schema(
  {
    authorName: {
      type: String,
      required: true,
      trim: true
    },
    authorId: {
      type: String,
      trim: true
    },
    authorRole: {
      type: String,
      required: true,
      trim: true
    },
    authorAvatarUrl: String,
    verified: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    media: {
      kind: {
        type: String,
        enum: ["video", "code", "roadmap", "notes", "showcase", "none"],
        default: "none"
      },
      label: String,
      labelIcon: String,
      title: String,
      subtitle: String,
      duration: String,
      frameKey: String,
      imageUrl: String,
      thumbnailUrl: String,
      fileUri: String,
      videoUrl: String,
      mimeType: String,
      carouselImages: [String],
      fileName: String,
      fileSize: String,
      codeLines: [String],
      roadmapSteps: [String]
    },
    metrics: {
      likes: {
        type: Number,
        default: 0
      },
      comments: {
        type: Number,
        default: 0
      },
      shares: {
        type: Number,
        default: 0
      }
    },
    likedBy: [
      {
        type: String
      }
    ],
    commentsList: [
      {
        id: String,
        userId: String,
        name: String,
        avatarUrl: String,
        text: String,
        time: String,
        likes: {
          type: Number,
          default: 0
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    tags: [String],
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);
