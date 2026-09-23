import express from "express";
import mongoose from "mongoose";
import { Job } from "../models/Job.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { resolveMediaUrl } from "./uploads.js";
import {
  notifyApplicantStatusUpdated,
  notifyJobApplied,
  notifyJobPosted
} from "../services/pushNotificationService.js";

export const jobsRouter = express.Router();

const APPLICANT_STATUSES = new Set(["pending", "selected", "rejected"]);
const JOB_EDITABLE_FIELDS = new Set([
  "title", "company", "description", "minSalary", "maxSalary", "salaryPeriod",
  "requiredCandidates", "startDate", "deadline", "imageUrl", "documentUrl",
  "documentName", "documentSize", "status"
]);

function userId(user) {
  return String(user?._id || user?.id || "");
}

function canManageJob(user, job) {
  if (!user || !job) return false;
  if (user.role === "admin") return true;
  if (!canCreateJob(user) || (user.role === "mentor" && user.isApproved === false)) return false;
  return Boolean(userId(user) && String(job.mentorId || "") === userId(user));
}

function canCreateJob(user) {
  return user?.role === "admin" || user?.role === "mentor" || user?.role === "partner";
}

function pickJobUpdates(payload = {}) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => JOB_EDITABLE_FIELDS.has(key)));
}

function formatJob(job, user, { includeApplicants = false } = {}) {
  const value = typeof job?.toObject === "function" ? job.toObject() : { ...job };
  const applicants = Array.isArray(value.applicants) ? value.applicants : [];
  const currentUserId = userId(user);
  const selectedCount = applicants.filter((applicant) => applicant.status === "selected").length;
  const requiredCandidates = Number(value.requiredCandidates || 1);
  const managesJob = canManageJob(user, value);
  const result = {
    ...value,
    id: String(value._id || value.id),
    appliedCandidates: applicants.length || Number(value.appliedCandidates || 0),
    selectedCandidates: selectedCount,
    status: selectedCount >= requiredCandidates ? "filled" : value.status || "active",
    hasApplied: Boolean(currentUserId && applicants.some((applicant) => String(applicant.userId) === currentUserId)),
    isCreatedByMe: managesJob
  };

  if (!includeApplicants && !managesJob) delete result.applicants;
  return result;
}

function requireJobManager(req, res, job) {
  if (!canManageJob(req.user, job)) {
    res.status(403).json({ ok: false, message: "Only the job owner or an administrator can perform this action." });
    return false;
  }
  return true;
}

function getStore(req) {
  if (!req.app.locals.memoryStore) {
    req.app.locals.memoryStore = { jobs: [] };
  }
  if (!req.app.locals.memoryStore.jobs) {
    req.app.locals.memoryStore.jobs = [];
  }
  return req.app.locals.memoryStore;
}

// GET /api/jobs
jobsRouter.get("/", optionalAuth, async (req, res) => {
  try {
    const { filter } = req.query;
    let query = {};
    if (filter === "active") query.status = "active";
    if (filter === "filled") query.status = "filled";

    if (mongoose.connection.readyState === 1) {
      const dbJobs = await Job.find(query).sort({ createdAt: -1 }).lean();
      const formatted = dbJobs.map((job) => formatJob(job, req.user));
      return res.json({ ok: true, jobs: formatted });
    }

    const store = getStore(req);
    let jobs = store.jobs || [];
    if (filter === "active") jobs = jobs.filter((j) => j.status === "active");
    if (filter === "filled") jobs = jobs.filter((j) => j.status === "filled");
    return res.json({ ok: true, jobs: jobs.map((job) => formatJob(job, req.user)) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/jobs
jobsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const payload = req.body;
    if (!canCreateJob(req.user) || (req.user.role === "mentor" && req.user.isApproved === false)) {
      return res.status(403).json({ ok: false, message: "An approved mentor, partner, or administrator account is required." });
    }
    if (!payload.title || !payload.description) {
      return res.status(400).json({ ok: false, message: "Title and Description are required." });
    }

    const jobData = {
      title: payload.title,
      company: payload.company || "TCM Hiring Partner",
      mentorId: userId(req.user),
      mentorName: req.user.name || "TCM Mentor",
      mentorAvatarUrl: (await resolveMediaUrl(req.user.avatarUrl)) || req.user.avatarUrl || "",
      mentorRole: req.user.mentorCategory || req.user.role,
      description: payload.description,
      minSalary: payload.minSalary || "3,00,000",
      maxSalary: payload.maxSalary || "6,00,000",
      salaryPeriod: payload.salaryPeriod || "LPA",
      requiredCandidates: Number(payload.requiredCandidates) || 5,
      appliedCandidates: 0,
      selectedCandidates: 0,
      applicants: [],
      startDate: payload.startDate || "Immediate",
      deadline: payload.deadline || "Open until filled",
      imageUrl: (await resolveMediaUrl(payload.imageUrl)) || payload.imageUrl || "",
      documentUrl: payload.documentUrl || "",
      documentName: payload.documentName || (payload.documentUrl ? "Job_Description.pdf" : ""),
      documentSize: payload.documentSize || "1.5 MB",
      status: "active"
    };

    if (mongoose.connection.readyState === 1) {
      const created = await Job.create(jobData);
      const formatted = formatJob(created, req.user, { includeApplicants: true });
      return res.status(201).json({ ok: true, job: formatted });
    }

    const store = getStore(req);
    const newJob = {
      ...jobData,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    notifyJobPosted({
      mentorName: jobData.mentorName,
      jobTitle: jobData.title,
      company: jobData.company,
      jobId: mongoose.connection.readyState === 1 ? String(newJob.id || "") : newJob.id
    }).catch(() => {});

    return res.status(201).json({ ok: true, job: newJob });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// PUT /api/jobs/:id
jobsRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");
    const payload = req.body;
    const updates = pickJobUpdates(payload);

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
      if (!requireJobManager(req, res, job)) return;

      if (payload.imageUrl !== undefined) {
        updates.imageUrl = (await resolveMediaUrl(payload.imageUrl)) || payload.imageUrl;
      }
      Object.assign(job, updates);
      const selectedCount = (job.applicants || []).filter((a) => a.status === "selected").length;
      job.selectedCandidates = selectedCount;
      if (selectedCount >= Number(job.requiredCandidates || 1)) {
        job.status = "filled";
      }
      await job.save();
      return res.json({ ok: true, job: formatJob(job, req.user, { includeApplicants: true }) });
    }

    const store = getStore(req);
    const idx = store.jobs.findIndex((j) => j.id === cleanId || j.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, message: "Job not found" });

    const current = store.jobs[idx];
    if (!requireJobManager(req, res, current)) return;
    const updated = { ...current, ...updates };
    const selectedCount = (updated.applicants || []).filter((a) => a.status === "selected").length;
    updated.selectedCandidates = selectedCount;
    if (selectedCount >= Number(updated.requiredCandidates || 1)) {
      updated.status = "filled";
    }
    store.jobs[idx] = updated;
    return res.json({ ok: true, job: updated });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// DELETE /api/jobs/:id
jobsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
      if (!requireJobManager(req, res, job)) return;
      await job.deleteOne();
      return res.json({ ok: true, message: "Job deleted successfully" });
    }

    const store = getStore(req);
    const job = store.jobs.find((item) => item.id === cleanId || item.id === id);
    if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
    if (!requireJobManager(req, res, job)) return;
    store.jobs = store.jobs.filter((j) => j.id !== cleanId && j.id !== id);
    return res.json({ ok: true, message: "Job deleted successfully" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/jobs/:id/apply
jobsRouter.post("/:id/apply", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");
    const applicationData = req.body;

    const uId = userId(req.user);
    const applicantRecord = {
      userId: uId,
      name: req.user.name || "TCM Member",
      email: req.user.email || "",
      phone: applicationData.phone || req.user.contactNumber || "",
      portfolioUrl: applicationData.portfolioUrl || "",
      resumeUrl: (await resolveMediaUrl(applicationData.resumeUrl)) || applicationData.resumeUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
      resumeName: applicationData.resumeName || "Resume.pdf",
      resumeSize: applicationData.resumeSize || "1.2 MB",
      coverNote: applicationData.coverNote || "",
      status: "pending",
      appliedAt: new Date().toISOString().slice(0, 10)
    };

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });

      if (job.status !== "active") {
        return res.status(409).json({ ok: false, message: "This job is not accepting applications." });
      }

      if (job.applicants.some((a) => String(a.userId) === uId)) {
        return res.status(400).json({ ok: false, message: "You have already applied for this job!" });
      }

      job.applicants.unshift(applicantRecord);
      job.appliedCandidates = job.applicants.length;
      const selectedCount = job.applicants.filter((a) => a.status === "selected").length;
      job.selectedCandidates = selectedCount;
      if (selectedCount >= Number(job.requiredCandidates || 1)) {
        job.status = "filled";
      }
      await job.save();
      return res.json({ ok: true, job: formatJob(job, req.user) });
    }

    const store = getStore(req);
    const idx = store.jobs.findIndex((j) => j.id === cleanId || j.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, message: "Job not found" });

    const job = store.jobs[idx];
    if (job.status !== "active") {
      return res.status(409).json({ ok: false, message: "This job is not accepting applications." });
    }
    const applicants = job.applicants || [];
    if (applicants.some((a) => String(a.userId) === uId)) {
      return res.status(400).json({ ok: false, message: "You have already applied for this job!" });
    }

    const updatedApplicants = [applicantRecord, ...applicants];
    const selectedCount = updatedApplicants.filter((a) => a.status === "selected").length;
    const isFilled = selectedCount >= Number(job.requiredCandidates || 1);

    const updatedJob = {
      ...job,
      applicants: updatedApplicants,
      appliedCandidates: updatedApplicants.length,
      selectedCandidates: selectedCount,
      status: isFilled ? "filled" : "active"
    };

    store.jobs[idx] = updatedJob;

    notifyJobApplied({
      studentName: applicantRecord.name,
      studentId: uId,
      jobTitle: updatedJob.title,
      jobId: updatedJob.id,
      mentorId: updatedJob.mentorId || "m-1"
    }).catch(() => {});

    return res.json({ ok: true, job: formatJob(updatedJob, req.user) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// PUT /api/jobs/:id/applicants/:userId/status
jobsRouter.put("/:id/applicants/:userId/status", requireAuth, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { status } = req.body;
    const cleanId = id.replace(/^post-/, "");

    if (!APPLICANT_STATUSES.has(status)) {
      return res.status(400).json({ ok: false, message: "Invalid applicant status." });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
      if (!requireJobManager(req, res, job)) return;

      const appIndex = job.applicants.findIndex((a) => String(a.userId) === String(userId));
      if (appIndex === -1) return res.status(404).json({ ok: false, message: "Applicant not found" });
      job.applicants[appIndex].status = status;
      const selectedCount = job.applicants.filter((a) => a.status === "selected").length;
      job.selectedCandidates = selectedCount;
      if (selectedCount >= Number(job.requiredCandidates || 1)) {
        job.status = "filled";
      } else {
        job.status = "active";
      }
      await job.save();
      return res.json({ ok: true, job: formatJob(job, req.user, { includeApplicants: true }) });
    }

    const store = getStore(req);
    const idx = store.jobs.findIndex((j) => j.id === cleanId || j.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, message: "Job not found" });

    const job = store.jobs[idx];
    if (!requireJobManager(req, res, job)) return;
    if (!(job.applicants || []).some((applicant) => String(applicant.userId) === String(userId))) {
      return res.status(404).json({ ok: false, message: "Applicant not found" });
    }
    const updatedApplicants = (job.applicants || []).map((app) => {
      if (String(app.userId) === String(userId)) {
        return { ...app, status };
      }
      return app;
    });

    const selectedCount = updatedApplicants.filter((a) => a.status === "selected").length;
    const isFilled = selectedCount >= Number(job.requiredCandidates || 1);

    const updatedJob = {
      ...job,
      applicants: updatedApplicants,
      selectedCandidates: selectedCount,
      status: isFilled ? "filled" : "active"
    };

    store.jobs[idx] = updatedJob;

    notifyApplicantStatusUpdated({
      studentId: userId,
      jobTitle: updatedJob.title,
      status: status,
      jobId: updatedJob.id,
      mentorName: updatedJob.mentorName
    }).catch(() => {});

    return res.json({ ok: true, job: updatedJob });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// GET /api/jobs/:id/applicants
jobsRouter.get("/:id/applicants", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId).lean();
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
      if (!requireJobManager(req, res, job)) return;
      return res.json({ ok: true, applicants: job?.applicants || [] });
    }

    const store = getStore(req);
    const job = store.jobs.find((j) => j.id === cleanId || j.id === id);
    if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
    if (!requireJobManager(req, res, job)) return;
    return res.json({ ok: true, applicants: job?.applicants || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});
