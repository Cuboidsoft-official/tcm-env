import mongoose from "mongoose";

const webinarSchema = new mongoose.Schema(
  {
    customId: { type: String, unique: true },
    eventType: { type: String, enum: ["Webinar", "Event"], default: "Webinar" },
    webinarType: { type: String, enum: ["Free Webinar", "Paid Webinar"], default: "Free Webinar" },
    price: { type: String, default: "Free" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    bannerUrl: { type: String, default: "" },
    learningPoints: [{ type: String }],
    dateTime: { type: String, default: "Today • 6:00 PM" },
    duration: { type: String, default: "60 Mins" },
    meetLink: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    pdfName: { type: String, default: "" },
    registrationLimit: { type: String, default: "" },
    registeredStudentsCount: { type: Number, default: 0 },
    mentorId: { type: String },
    mentorName: { type: String, default: "TCM One Educator" },
    mentorRole: { type: String, default: "Top Mentor" },
    mentorAvatarUrl: { type: String, default: "" },
    status: { type: String, enum: ["upcoming", "live", "completed", "draft"], default: "upcoming" }
  },
  { timestamps: true }
);

export const Webinar = mongoose.models.Webinar || mongoose.model("Webinar", webinarSchema);
