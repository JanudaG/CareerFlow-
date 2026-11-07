
const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const validId = (id) => mongoose.isValidObjectId(id);

const legacyStatus = {
  Applied: "submitted",
  "Under Review": "reviewing",
  Interview: "interview",
  Accepted: "offered",
  Rejected: "rejected",
};

function present(application) {
  const a = application.toObject
    ? application.toObject()
    : application;

  return {
    ...a,
    status: legacyStatus[a.status] || a.status,
    internship: a.job,
    student: a.applicant,
  };
}

router.get(
  "/mine",
  requireAuth,
  requireRole("jobseeker"),
  async (req, res) => {
    try {
      const apps = await Application.find({
        applicant: req.user._id,
      })
        .populate({
          path: "job",
          populate: {
            path: "postedBy",
            select: "name companyName",
          },
        })
        .sort({ createdAt: -1 });

      res.json(apps.map(present));
    } catch {
      res.status(500).json({
        message: "Could not load applications.",
      });
    }
  }
);

router.get(
  "/job/:jobId",
  requireAuth,
  requireRole("employer"),
  async (req, res) => {
    try {
      if (!validId(req.params.jobId)) {
        return res.status(400).json({
          message: "Invalid job ID.",
        });
      }

      const job = await Job.findOne({
        _id: req.params.jobId,
        postedBy: req.user._id,
      });

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      const apps = await Application.find({
        job: job._id,
      })
        .populate("applicant", "name email skills bio resumeLink university degree field gpa")
        .populate("job", "title location")
        .sort({ createdAt: -1 });

      res.json(apps.map(present));
    } catch {
      res.status(500).json({
        message: "Could not load applicants.",
      });
    }
  }
);

router.post(
  "/:jobId",
  requireAuth,
  requireRole("jobseeker"),
  async (req, res) => {
    try {
      if (!validId(req.params.jobId)) {
        return res.status(400).json({
          message: "Invalid job ID.",
        });
      }

      const job = await Job.findById(req.params.jobId);

      if (!job || job.status !== "open") {
        return res.status(404).json({
          message: "Open job not found.",
        });
      }

      if (
        job.closingDate &&
        job.closingDate.getTime() < Date.now()
      ) {
        return res.status(400).json({
          message: "Application deadline has passed.",
        });
      }

      const note = req.body?.coverNote ?? "";

      if (typeof note !== "string" || note.length > 1000) {
        return res.status(400).json({
          message: "Invalid cover note.",
        });
      }

      const existing = await Application.findOne({
        job: job._id,
        applicant: req.user._id,
      });

      if (existing) {
        return res.status(409).json({
          message: "You already applied to this job.",
        });
      }

      const application = await Application.create({
        job: job._id,
        applicant: req.user._id,
        coverNote: note.trim(),
      });

      res.status(201).json(present(application));
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          message: "You already applied to this job.",
        });
      }

      res.status(500).json({
        message: "Could not submit application.",
      });
    }
  }
);

// Company updates an applicant's status.
router.patch(
  "/:applicationId/status",
  requireAuth,
  requireRole("employer"),
  async (req, res) => {
    try {
      const allowed = [
        "submitted",
        "reviewing",
        "shortlisted",
        "interview",
        "offered",
        "rejected",
      ];

      if (!validId(req.params.applicationId)) {
        return res.status(400).json({
          message: "Invalid application ID.",
        });
      }

      if (!allowed.includes(req.body.status)) {
        return res.status(400).json({
          message: "Invalid application status.",
        });
      }

      const app = await Application.findById(
        req.params.applicationId
      ).populate("job", "postedBy");

      if (!app || !app.job) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      if (
        String(app.job.postedBy) !== String(req.user._id)
      ) {
        return res.status(403).json({
          message: "Permission denied.",
        });
      }

      if (present(app).status === "withdrawn") {
        return res.status(409).json({
          message: "Withdrawn applications cannot be updated.",
        });
      }

      app.status = req.body.status;
      await app.save();

      res.json(present(app));
    } catch {
      res.status(500).json({
        message: "Could not update application.",
      });
    }
  }
);

// Job seeker withdraws an application.
router.patch(
  "/:applicationId/withdraw",
  requireAuth,
  requireRole("jobseeker"),
  async (req, res) => {
    try {
      if (!validId(req.params.applicationId)) {
        return res.status(400).json({
          message: "Invalid application ID.",
        });
      }

      const app = await Application.findOne({
        _id: req.params.applicationId,
        applicant: req.user._id,
      });

      if (!app) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      const current = present(app).status;

      if (["offered", "rejected", "withdrawn"].includes(current)) {
        return res.status(409).json({
          message: "This application cannot be withdrawn.",
        });
      }

      app.status = "withdrawn";
      await app.save();

      res.json(present(app));
    } catch {
      res.status(500).json({
        message: "Could not withdraw application.",
      });
    }
  }
);

// Delete own application.
router.delete(
  "/:applicationId",
  requireAuth,
  requireRole("jobseeker"),
  async (req, res) => {
    try {
      if (!validId(req.params.applicationId)) {
        return res.status(400).json({
          message: "Invalid application ID.",
        });
      }

      const app = await Application.findOne({
        _id: req.params.applicationId,
        applicant: req.user._id,
      });

      if (!app) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      if (present(app).status !== "withdrawn") {
        return res.status(409).json({
          message: "Withdraw the application before deleting it.",
        });
      }

      await app.deleteOne();

      res.json({
        message: "Application deleted successfully.",
      });
    } catch {
      res.status(500).json({
        message: "Could not delete application.",
      });
    }
  }
);

module.exports = router;
