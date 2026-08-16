import express from "express";
import mongoose from "mongoose";
import { Job } from "../models/Job.js";
import { resolveMediaUrl } from "./uploads.js";
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

// GET /api/jobs
jobsRouter.get("/", async (req, res) => {
  try {
    const { filter } = req.query;
    let query = {};
    if (filter === "active") query.status = "active";
    if (filter === "filled") query.status = "filled";

    if (mongoose.connection.readyState === 1) {
      const dbJobs = await Job.find(query).sort({ createdAt: -1 }).lean();
      const formatted = dbJobs.map((j) => {
        const applicants = j.applicants || [];
        const selectedCount = applicants.filter((a) => a.status === "selected").length;
        const reqLimit = Number(j.requiredCandidates || 1);
        const isFilled = selectedCount >= reqLimit;
        return {
          ...j,
          id: String(j._id),
          selectedCandidates: selectedCount,
          status: isFilled ? "filled" : j.status || "active"
        };
      });
      return res.json({ ok: true, jobs: formatted });
    }

    const store = getStore(req);
    let jobs = store.jobs || [];
    if (filter === "active") jobs = jobs.filter((j) => j.status === "active");
    if (filter === "filled") jobs = jobs.filter((j) => j.status === "filled");
    return res.json({ ok: true, jobs });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/jobs
jobsRouter.post("/", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.description) {
      return res.status(400).json({ ok: false, message: "Title and Description are required." });
    }

    const jobData = {
      title: payload.title,
      company: payload.company || "TCM Hiring Partner",
      mentorId: payload.mentorId || "m-1",
      mentorName: payload.mentorName || "Mentor",
      mentorAvatarUrl: (await resolveMediaUrl(payload.mentorAvatarUrl)) || payload.mentorAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
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
      imageUrl: (await resolveMediaUrl(payload.imageUrl)) || payload.imageUrl || "",
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
jobsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");
    const payload = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });

      if (payload.imageUrl !== undefined) {
        payload.imageUrl = (await resolveMediaUrl(payload.imageUrl)) || payload.imageUrl;
      }
      if (payload.mentorAvatarUrl !== undefined) {
        payload.mentorAvatarUrl = (await resolveMediaUrl(payload.mentorAvatarUrl)) || payload.mentorAvatarUrl;
      }
      Object.assign(job, payload);
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

    const current = store.jobs[idx];
    const updated = { ...current, ...payload };
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
jobsRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      await Job.findByIdAndDelete(cleanId);
      return res.json({ ok: true, message: "Job deleted successfully" });
    }

    const store = getStore(req);
    store.jobs = store.jobs.filter((j) => j.id !== cleanId && j.id !== id);
    return res.json({ ok: true, message: "Job deleted successfully" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// POST /api/jobs/:id/apply
jobsRouter.post("/:id/apply", async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");
    const applicationData = req.body;

    const uId = String(applicationData.userId || applicationData.id || "student-user");
    const applicantRecord = {
      userId: uId,
      name: applicationData.name || "Student Candidate",
      email: applicationData.email || "student@tcm.edu",
      phone: applicationData.phone || "+91 9876543210",
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
      return res.json({ ok: true, job: { ...job.toObject(), id: String(job._id) } });
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

    return res.json({ ok: true, job: updatedJob });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// PUT /api/jobs/:id/applicants/:userId/status
jobsRouter.put("/:id/applicants/:userId/status", async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { status } = req.body;
    const cleanId = id.replace(/^post-/, "");

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId);
      if (!job) return res.status(404).json({ ok: false, message: "Job not found" });

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
      return res.json({ ok: true, job: { ...job.toObject(), id: String(job._id) } });
    }

    const store = getStore(req);
    const idx = store.jobs.findIndex((j) => j.id === cleanId || j.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, message: "Job not found" });

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

    return res.json({ ok: true, job: updatedJob });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});

// GET /api/jobs/:id/applicants
jobsRouter.get("/:id/applicants", async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace(/^post-/, "");

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cleanId)) {
      const job = await Job.findById(cleanId).lean();
      return res.json({ ok: true, applicants: job?.applicants || [] });
    }

    const store = getStore(req);
    const job = store.jobs.find((j) => j.id === cleanId || j.id === id);
    return res.json({ ok: true, applicants: job?.applicants || [] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
});
