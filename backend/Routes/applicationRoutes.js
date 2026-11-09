
const express = require("express");
const mongoose = require("mongoose");

const Application = require("../models/Application");
const Job = require("../models/Job");

const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");

const router = express.Router();

// ================================================
// HELPERS
// ================================================

const validId = (id) => mongoose.isValidObjectId(id);

const legacyStatus = {
  Applied: "submitted",
  "Under Review": "reviewing",
  Interview: "interview",
  Accepted: "offered",
  Rejected: "rejected",
};

function normalizeStatus(status) {
  return legacyStatus[status] || status;
}

function validEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function validPhone(phone) {
  if (typeof phone !== "string") {
    return false;
  }

  const normalized = phone.replace(/[\s().-]/g, "");

  return /^\+?[0-9]{7,15}$/.test(normalized);
}

function present(application) {
  const a =
    typeof application?.toObject === "function"
      ? application.toObject()
      : application;

  return {
    ...a,
    status: normalizeStatus(a.status),
    internship: a.job,
    student: a.applicant,
  };
}

// ================================================
// GET MY APPLICATIONS - JOB SEEKER
// ================================================

router.get(
  "/mine",
  requireAuth,
  requireRole("jobseeker"),
  async (req, res) => {
    try {
      const applications = await Application.find({
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

      return res.json(applications.map(present));
    } catch (err) {
      console.error("Get my applications error:", err);

      return res.status(500).json({
        message: "Could not load applications.",
      });
    }
  }
);

// ================================================
// GET JOB APPLICANTS - EMPLOYER
// ================================================

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

      // Verify that the employer owns the job.
      const job = await Job.findOne({
        _id: req.params.jobId,
        postedBy: req.user._id,
      });

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      const applications = await Application.find({
        job: job._id,
      })
        .populate({
          path: "applicant",
          select: [
            "name",
            "email",
            "university",
            "degree",
            "field",
            "gpa",
            "skills",
            "bio",
            "experience",
            "resumeLink",
          ].join(" "),
        })
        .populate("job", "title location")
        .sort({ createdAt: -1 });

      // Application-level contactEmail and contactPhone
      // are included in the response automatically.
      return res.json(applications.map(present));
    } catch (err) {
      console.error("Get job applicants error:", err);

      return res.status(500).json({
        message: "Could not load applicants.",
      });
    }
  }
);

// ================================================
// SUBMIT JOB APPLICATION - JOB SEEKER
// ================================================

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
        new Date(job.closingDate).getTime() < Date.now()
      ) {
        return res.status(400).json({
          message: "Application deadline has passed.",
        });
      }

      const {
        contactEmail,
        contactPhone,
        coverNote = "",
      } = req.body || {};

      // Validate email.
      if (
        typeof contactEmail !== "string" ||
        !validEmail(contactEmail.trim())
      ) {
        return res.status(400).json({
          message: "Please enter a valid contact email.",
        });
      }

      // Validate phone.
      if (
        typeof contactPhone !== "string" ||
        !validPhone(contactPhone.trim())
      ) {
        return res.status(400).json({
          message: "Please enter a valid phone number.",
        });
      }

      // Validate cover note.
      if (
        typeof coverNote !== "string" ||
        coverNote.length > 1000
      ) {
        return res.status(400).json({
          message: "Invalid cover note.",
        });
      }

      // Prevent duplicate applications.
      const existing = await Application.findOne({
        job: job._id,
        applicant: req.user._id,
      });

      if (existing) {
        return res.status(409).json({
          message: "You already applied to this job.",
        });
      }

      // Save contact details in application document.
      const application = await Application.create({
        job: job._id,
        applicant: req.user._id,
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        coverNote: coverNote.trim(),
      });

      return res.status(201).json(present(application));
    } catch (err) {
      console.error("Submit application error:", err);

      if (err.code === 11000) {
        return res.status(409).json({
          message: "You already applied to this job.",
        });
      }

      if (err.name === "ValidationError") {
        return res.status(400).json({
          message: "Invalid application details.",
        });
      }

      return res.status(500).json({
        message: "Could not submit application.",
      });
    }
  }
);

// ================================================
// UPDATE APPLICATION STATUS - EMPLOYER
// ================================================

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

      const newStatus = req.body?.status;

      if (!allowed.includes(newStatus)) {
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

      // Only the job owner may update status.
      if (
        String(app.job.postedBy) !==
        String(req.user._id)
      ) {
        return res.status(403).json({
          message: "Permission denied.",
        });
      }

      if (normalizeStatus(app.status) === "withdrawn") {
        return res.status(409).json({
          message: "Withdrawn applications cannot be updated.",
        });
      }

      // Update only status instead of saving the
      // entire legacy application document.
      const updated = await Application.findOneAndUpdate(
        {
          _id: app._id,
          status: app.status,
        },
        {
          $set: { status: newStatus },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updated) {
        return res.status(409).json({
          message: "Application changed. Please refresh.",
        });
      }

      return res.json(present(updated));
    } catch (err) {
      console.error("Update application status error:", err);

      return res.status(500).json({
        message: "Could not update application.",
      });
    }
  }
);

// ================================================
// WITHDRAW APPLICATION - JOB SEEKER
// ================================================

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

      const currentStatus = normalizeStatus(app.status);

      if (
        ["offered", "rejected", "withdrawn"].includes(
          currentStatus
        )
      ) {
        return res.status(409).json({
          message: "This application cannot be withdrawn.",
        });
      }

      // IMPORTANT:
      // findOneAndUpdate validates the updated status,
      // without requiring missing contact fields on
      // old application documents.
      const updated = await Application.findOneAndUpdate(
        {
          _id: app._id,
          applicant: req.user._id,
          status: app.status,
        },
        {
          $set: {
            status: "withdrawn",
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updated) {
        return res.status(409).json({
          message: "Application changed. Please refresh.",
        });
      }

      return res.json(present(updated));
    } catch (err) {
      console.error("Withdraw application error:", err);

      return res.status(500).json({
        message: "Could not withdraw application.",
      });
    }
  }
);

// ================================================
// DELETE APPLICATION - JOB SEEKER
// ================================================

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

      if (normalizeStatus(app.status) !== "withdrawn") {
        return res.status(409).json({
          message:
            "Withdraw the application before deleting it.",
        });
      }

      await app.deleteOne();

      return res.json({
        message: "Application deleted successfully.",
      });
    } catch (err) {
      console.error("Delete application error:", err);

      return res.status(500).json({
        message: "Could not delete application.",
      });
    }
  }
);

module.exports = router;
