import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, default: "Student Candidate" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    portfolioUrl: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    resumeName: { type: String, default: "Resume.pdf" },
    resumeSize: { type: String, default: "1.0 MB" },
    coverNote: { type: String, default: "" },
    status: { type: String, enum: ["pending", "selected", "rejected"], default: "pending" },
    appliedAt: { type: String, default: () => new Date().toISOString().slice(0, 10) }
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, default: "TCM One Hiring Partner" },
    mentorId: { type: String },
    mentorName: { type: String, default: "Mentor" },
    mentorAvatarUrl: { type: String, default: "" },
    mentorRole: { type: String, default: "Senior Mentor" },
    description: { type: String, required: true },
    minSalary: { type: String, default: "3,00,000" },
    maxSalary: { type: String, default: "6,00,000" },
    salaryPeriod: { type: String, default: "LPA" },
    requiredCandidates: { type: Number, default: 5 },
    appliedCandidates: { type: Number, default: 0 },
    selectedCandidates: { type: Number, default: 0 },
    applicants: [applicantSchema],
    startDate: { type: String, default: "Immediate" },
    deadline: { type: String, default: "Open until filled" },
    imageUrl: { type: String, default: "" },
    documentUrl: { type: String, default: "" },
    documentName: { type: String, default: "" },
    documentSize: { type: String, default: "1.5 MB" },
    status: { type: String, enum: ["active", "filled", "expired"], default: "active" }
  },
  { timestamps: true }
);

export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
