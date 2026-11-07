
const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const Application = require("../models/Application");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const validId = (id) => mongoose.isValidObjectId(id);

const parseSkills = (value) => {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,]/)
      : [];

  return [...new Set(
    items.map((x) => String(x).trim()).filter(Boolean)
  )].slice(0, 30);
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function validateJob(body, creating = false) {
  const errors = [];

  if (creating || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      errors.push("Title is required.");
    }
  }

  if (creating || body.description !== undefined) {
    if (
      typeof body.description !== "string" ||
      !body.description.trim()
    ) {
      errors.push("Description is required.");
    }
  }

  if (body.minimumGpa !== undefined &&
      body.minimumGpa !== null &&
      body.minimumGpa !== "") {
    const gpa = Number(body.minimumGpa);
    if (!Number.isFinite(gpa) || gpa < 0 || gpa > 4) {
      errors.push("Minimum GPA must be between 0 and 4.");
    }
  }

  if (body.openings !== undefined) {
    const n = Number(body.openings);
    if (!Number.isInteger(n) || n < 1) {
      errors.push("Openings must be a positive integer.");
    }
  }

  if (body.status !== undefined &&
      !["open", "closed"].includes(body.status)) {
    errors.push("Invalid job status.");
  }

  if (body.closingDate) {
    const date = new Date(body.closingDate);
    if (Number.isNaN(date.getTime())) {
      errors.push("Invalid closing date.");
    }
  }

  return errors;
}

function jobPayload(body) {
  const result = {};
  const strings = [
    "title",
    "description",
    "location",
    "salaryRange",
    "preferredField",
    "preferredDegree",
  ];

  for (const key of strings) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "string") {
        throw new Error(`${key} must be a string.`);
      }
      result[key] = body[key].trim();
    }
  }

  if (body.requirements !== undefined) {
    result.requirements = parseSkills(body.requirements);
  }

  if (body.minimumGpa !== undefined) {
    result.minimumGpa =
      body.minimumGpa === "" || body.minimumGpa === null
        ? null
        : Number(body.minimumGpa);
  }

  if (body.openings !== undefined) {
    result.openings = Number(body.openings);
  }

  if (body.closingDate !== undefined) {
    result.closingDate = body.closingDate
      ? new Date(body.closingDate)
      : null;
  }

  if (body.status !== undefined) {
    result.status = body.status;
  }

  return result;
}

// Public job browsing
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.search) {
      const search = escapeRegex(
        String(req.query.search).slice(0, 80)
      );
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { requirements: { $regex: search, $options: "i" } },
      ];
    }

    if (req.query.location) {
      filter.location = {
        $regex: escapeRegex(
          String(req.query.location).slice(0, 80)
        ),
        $options: "i",
      };
    }

    if (req.query.status) {
      if (!["open", "closed"].includes(req.query.status)) {
        return res.status(400).json({
          message: "Invalid status filter.",
        });
      }
      filter.status = req.query.status;
    }

    const jobs = await Job.find(filter)
      .populate("postedBy", "name companyName")
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch {
    res.status(500).json({ message: "Could not load jobs." });
  }
});

// Must be before /:id
router.get(
  "/mine",
  requireAuth,
  requireRole("employer"),
  async (req, res) => {
    try {
      const jobs = await Job.find({
        postedBy: req.user._id,
      }).sort({ createdAt: -1 });

      res.json(jobs);
    } catch {
      res.status(500).json({
        message: "Could not load your jobs.",
      });
    }
  }
);

router.get("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid job ID.",
      });
    }

    const job = await Job.findById(req.params.id)
      .populate("postedBy", "name companyName");

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    res.json(job);
  } catch {
    res.status(500).json({
      message: "Could not load job.",
    });
  }
});

router.post(
  "/",
  requireAuth,
  requireRole("employer"),
  async (req, res) => {
    try {
      const errors = validateJob(req.body, true);
      if (errors.length) {
        return res.status(400).json({
          message: errors.join(" "),
        });
      }

      const job = await Job.create({
        ...jobPayload(req.body),
        postedBy: req.user._id,
      });

      res.status(201).json(job);
    } catch (err) {
      res.status(400).json({
        message: err.message || "Could not create job.",
      });
    }
  }
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("employer"),
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid job ID.",
        });
      }

      const errors = validateJob(req.body);
      if (errors.length) {
        return res.status(400).json({
          message: errors.join(" "),
        });
      }

      const job = await Job.findOne({
        _id: req.params.id,
        postedBy: req.user._id,
      });

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      Object.assign(job, jobPayload(req.body));
      await job.save();

      res.json(job);
    } catch (err) {
      res.status(400).json({
        message: err.message || "Could not update job.",
      });
    }
  }
);

// Delete a job and its applications.
// Transaction requires MongoDB replica set / Atlas.
router.delete(
  "/:id",
  requireAuth,
  requireRole("employer"),
  async (req, res) => {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid job ID.",
      });
    }

    try {
      await mongoose.connection.transaction(async (session) => {
        const job = await Job.findOne({
          _id: req.params.id,
          postedBy: req.user._id,
        }).session(session);

        if (!job) {
          const err = new Error("Job not found.");
          err.status = 404;
          throw err;
        }

        await Application.deleteMany(
          { job: job._id },
          { session }
        );

        await Job.deleteOne(
          { _id: job._id },
          { session }
        );
      });

      res.json({ message: "Job deleted successfully." });
    } catch (err) {
      res.status(err.status || 500).json({
        message:
          err.status === 404
            ? err.message
            : "Could not delete job. MongoDB transactions require a replica set.",
      });
    }
  }
);

module.exports = router;
