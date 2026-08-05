import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  id: String,
  title: { type: String, required: true },
  duration: { type: String, default: "25 mins" },
  type: { type: String, default: "video" }
}, { _id: false });

const moduleSchema = new mongoose.Schema({
  id: String,
  title: { type: String, required: true },
  lessonsCount: String,
  lessons: [mongoose.Schema.Types.Mixed]
}, { _id: false });

const courseSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    level: {
      type: String,
      default: "All Levels"
    },
    price: {
      type: String,
      default: "₹1,499"
    },
    originalPrice: {
      type: String,
      default: "₹4,999"
    },
    discountPill: {
      type: String,
      default: "70% OFF"
    },
    rating: {
      type: Number,
      default: 5.0
    },
    reviewsCount: {
      type: String,
      default: "1"
    },
    studentsCount: {
      type: String,
      default: "100+"
    },
    duration: {
      type: String,
      default: "20 Days"
    },
    imageUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=80"
    },
    mentorId: {
      type: String,
      index: true
    },
    mentorName: String,
    mentorRole: String,
    mentorAvatarUrl: String,
    mentor: {
      name: String,
      role: String,
      avatarUrl: String
    },
    whatYouWillLearn: [String],
    features: [mongoose.Schema.Types.Mixed],
    modules: [moduleSchema],
    isLive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
