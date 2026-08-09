import express from "express";
import mongoose from "mongoose";
import { Job } from "../models/Job.js";
import { requireAuth } from "../middleware/auth.js";
import {
  notifyApplicantStatusUpdated,
  notifyJobApplied,
  notifyJobPosted
} from "../services/pushNotificationService.js";

export const jobsRouter = express.Router();

function getStore(req) {
  if (!req.app.locals.memoryStore) {
    req.app.locals.memoryStore = { jobs: [] };
  }
  if (!req.app.locals.memoryStore.jobs) {
    req.app.locals.memoryStore.jobs = [];
  }
  return req.app.locals.memoryStore;
}

function isOwner(user, job) {
  if (!user) return false;
  const userId = String(user._id || user.id || "");
  const mentorId = String(job.mentorId || "");
  return (userId && mentorId === userId) || user.role === "admin" || job.isCreatedByMe === true;
}

function publicJob(job) {
  const applicants = job.applicants || [];
  const selectedCount = applicants.filter((a) => a.status === "selected").length;
  const reqLimit = Number(job.requiredCandidates || 1);
  const isFilled = selectedCount >= reqLimit;
  const { applicants: _omit, ...rest } = job;
  return {
    ...rest,
    id: String(job.id || job._id),
    applicantsCount: applicants.length,
    appliedCandidates: job.appliedCandidates || applicants.length,
    selectedCandidates: selectedCount,
    status: isFilled ? "filled" : job.status || "active"
  };
}

// GET /api/jobs — public listing, NO applicant PII
jobsRouter.get("/", async (req, res) => {
  try {
    const { filter } = req.query;
    let query = {};
    if (filter === "active") query.status = "active";
    if (filter === "filled") query.status = "filled";

    if (mongoose.connection.readyState === 1) {
      const dbJobs = await Job.find(query).sort({ createdAt: -1 }).lean();
      return res.json({ ok: true, jobs: dbJobs.map((j) => publicJob(j)) });
    }

    const store = getStore(req);
    let jobs = store.jobs || [];
    if (filter === "active") jobs = jobs.filter((j) => j.status === "active");
    if (filter === "filled") jobs = jobs.filter((j) => j.status === "filled");
    return res.json({ ok: true, jobs: jobs.map((j) => publicJob(j)) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Could not fetch jobs" });
  }
});

// POST /api/jobs — requires auth
jobsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.description) {
      return res.status(400).json({ ok: false, message: "Title and Description are required." });
    }

    const jobData = {
      title: payload.title,
      company: payload.company || "TCM Hiring Partner",
      mentorId: payload.mentorId || String(req.user._id || req.user.id || "m-1"),
      mentorName: payload.mentorName || req.user.name || "Mentor",
      mentorAvatarUrl: payload.mentorAvatarUrl || req.user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      mentorRole: payload.mentorRole || "Senior Mentor",
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
      imageUrl: payload.imageUrl || "",
      documentUrl: payload.documentUrl || "",
      documentName: payload.documentName || (payload.documentUrl ? "Job_Description.pdf" : ""),
      documentSize: payload.documentSize || "1.5 MB",
      status: "active"
    };

    if (mongoose.connection.readyState === 1) {
      const created = await Job.create(jobData);
      const formatted = { ...created.toObject(), id: String(created._id) };
      return res.status(201).json({ ok: true, job: formatted });
    }

    const store = getStore(req);
    const newJob = {
      ...jobData,
      id: `job-${Date.now()}`,
      isCreatedByMe: true,
      createdAt: new Date().toISOString()
    };
    notifyJobPosted({
      mentorName: jobData.mentorName,
      jobTitle: jobData.title,
      company: jobData.company,
      jobId: newJob.id
    }).catch(() => {});

    return res.status(201).json({ ok: true, job: newJob });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Could not create job" });
  }
});

// PUT /api/jobs/:id — requires auth + ownership
jobsRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");
    const payload = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
      if (!isOwner(req.user, job)) return res.status(403).json({ ok: false, message: "You can only edit your own job postings" });

      const { applicants: _omit, ...editable } = payload;
      Object.assign(job, editable);
      const selectedCount = (job.applicants || []).filter((a) => a.status === "selected").length;
      job.selectedCandidates = selectedCount;
      if (selectedCount >= Number(job.requiredCandidates || 1)) {
        job.status = "filled";
      }
      await job.save();
      return res.json({ ok: true, job: { ...job.toObject(), id: String(job._id) } });
    }

    const store = getStore(req);
    const idx = store.jobs.findIndex((j) => j.id === cleanId || j.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, message: "Job not found" });
    if (!isOwner(req.user, store.jobs[idx])) return res.status(403).json({ ok: false, message: "You can only edit your own job postings" });

    const current = store.jobs[idx];
    const { applicants: _omit, ...editable } = payload;
    const updated = { ...current, ...editable };
    const selectedCount = (updated.applicants || []).filter((a) => a.status === "selected").length;
    updated.selectedCandidates = selectedCount;
    if (selectedCount >= Number(updated.requiredCandidates || 1)) {
      updated.status = "filled";
    }
    store.jobs[idx] = updated;
    return res.json({ ok: true, job: updated });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Could not update job" });
  }
});

// DELETE /api/jobs/:id — requires auth + ownership
jobsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
      if (!isOwner(req.user, job)) return res.status(403).json({ ok: false, message: "You can only delete your own job postings" });
      await Job.findByIdAndDelete(cleanId);
      return res.json({ ok: true, message: "Job deleted successfully" });
    }

    const store = getStore(req);
    const idx = store.jobs.findIndex((j) => j.id === cleanId || j.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, message: "Job not found" });
    if (!isOwner(req.user, store.jobs[idx])) return res.status(403).json({ ok: false, message: "You can only delete your own job postings" });
    store.jobs = store.jobs.filter((j) => j.id !== cleanId && j.id !== id);
    return res.json({ ok: true, message: "Job deleted successfully" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Could not delete job" });
  }
});

// POST /api/jobs/:id/apply — requires auth; identity from token, not the body
jobsRouter.post("/:id/apply", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");
    const applicationData = req.body;

    const uId = String(req.user._id || req.user.id);
    const applicantRecord = {
      userId: uId,
      name: applicationData.name || req.user.name || "Student Candidate",
      email: applicationData.email || req.user.email || "",
      phone: applicationData.phone || "",
      portfolioUrl: applicationData.portfolioUrl || "",
      resumeUrl: applicationData.resumeUrl || "",
      resumeName: applicationData.resumeName || (applicationData.resumeUrl ? "Resume.pdf" : ""),
      resumeSize: applicationData.resumeSize || "",
      coverNote: applicationData.coverNote || "",
      status: "pending",
      appliedAt: new Date().toISOString().slice(0, 10)
    };

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });

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
      return res.json({ ok: true, job: publicJob({ ...job.toObject(), id: String(job._id) }) });
    }

    const store = getStore(req);
    const idx = store.jobs.findIndex((j) => j.id === cleanId || j.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, message: "Job not found" });

    const job = store.jobs[idx];
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

    return res.json({ ok: true, job: publicJob(updatedJob) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Could not apply for job" });
  }
});

// PUT /api/jobs/:id/applicants/:userId/status — requires auth + ownership
jobsRouter.put("/:id/applicants/:userId/status", requireAuth, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { status } = req.body;
    const cleanId = id.replace(/^post-/, "");

    if (!["pending", "selected", "rejected"].includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid status" });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
      if (!isOwner(req.user, job)) return res.status(403).json({ ok: false, message: "You can only manage applicants on your own job postings" });

      const appIndex = job.applicants.findIndex((a) => String(a.userId) === String(userId));
      if (appIndex !== -1) {
        job.applicants[appIndex].status = status;
      }
      const selectedCount = job.applicants.filter((a) => a.status === "selected").length;
      job.selectedCandidates = selectedCount;
      if (selectedCount >= Number(job.requiredCandidates || 1)) {
        job.status = "filled";
      } else {
        job.status = "active";
      }
      await job.save();
      return res.json({ ok: true, job: publicJob({ ...job.toObject(), id: String(job._id) }) });
    }

    const store = getStore(req);
    const idx = store.jobs.findIndex((j) => j.id === cleanId || j.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, message: "Job not found" });
    if (!isOwner(req.user, store.jobs[idx])) return res.status(403).json({ ok: false, message: "You can only manage applicants on your own job postings" });

    const job = store.jobs[idx];
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

    return res.json({ ok: true, job: publicJob(updatedJob) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Could not update applicant status" });
  }
});

// GET /api/jobs/:id/applicants — requires auth + ownership (PII only for the job owner)
jobsRouter.get("/:id/applicants", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId).lean();
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
      if (!isOwner(req.user, job)) return res.status(403).json({ ok: false, message: "You can only view applicants on your own job postings" });
      return res.json({ ok: true, applicants: job.applicants || [] });
    }

    const store = getStore(req);
    const job = store.jobs.find((j) => j.id === cleanId || j.id === id);
    if (!job) return res.status(404).json({ ok: false, message: "Job not found" });
    if (!isOwner(req.user, job)) return res.status(403).json({ ok: false, message: "You can only view applicants on your own job postings" });
    return res.json({ ok: true, applicants: job.applicants || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Could not fetch applicants" });
  }
});
