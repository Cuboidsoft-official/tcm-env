import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  id: String,
  title: { type: String, required: true },
  duration: { type: String, default: "25 mins" },
  type: { type: String, default: "video" }
}, { _id: false });

const moduleSchema = new mongoose.Schema({
  id: String,
  legacyIds: { mysql: Number },
  title: { type: String, required: true },
  summary: String,
  order: { type: Number, default: 0 },
  lessonsCount: String,
  lessons: [mongoose.Schema.Types.Mixed]
}, { _id: false });

const courseSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      index: true
    },
    legacyIds: {
      mysql: Number
    },
    sourceSystem: { type: String, default: "app" },
    migrationBatchId: { type: String, index: true },
    schemaVersion: { type: Number, default: 1 },
    slug: { type: String, trim: true, index: true, sparse: true },
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      trim: true
    },
    description: { type: String, default: "" },
    category: {
      type: String,
      required: true,
      index: true
    },
    level: {
      type: String,
      default: "All Levels"
    },
    language: String,
    publicationStatus: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    certificate: { type: Boolean, default: false },
    categoryId: String,
    totalSeats: { type: Number, min: 0, default: 0 },
    seatsLeft: { type: Number, min: 0, default: 0 },
    seatsFilled: { type: Number, min: 0, default: 0 },
    schedule: String,
    startsAt: Date,
    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
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
    },
    activeLiveClass: {
      topic: String,
      meetingUrl: String,
      time: String,
      scheduledAt: Date
    }
  },
  { timestamps: true }
);

courseSchema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const Course = mongoose.model("Course", courseSchema);
