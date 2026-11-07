const express = require("express");
const mongoose = require("mongoose");
const Job = require("../models/Job");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

const invalidId = (id) => !mongoose.isValidObjectId(id);
const parseRequirements = (requirements) => {
  if (Array.isArray(requirements)) return requirements.map(item => String(item).trim()).filter(Boolean);
  if (typeof requirements === "string") return requirements.split("\n").map(item => item.trim()).filter(Boolean);
  return [];
};

// GET available jobs by title and location.
router.get("/", async (req, res) => {
  try {
    const { search, location } = req.query;
    const filter = {};
    if (typeof search === "string" && search.trim()) {
      filter.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 80), $options: "i" };
    }
    if (typeof location === "string" && location.trim()) {
      filter.location = { $regex: location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 80), $options: "i" };
    }
    const jobs = await Job.find(filter).sort({ createdAt: -1 }).populate("postedBy", "companyName name");
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Could not load jobs" });
  }
});

// Employer-owned jobs. Must be declared before /:id.
router.get("/mine", requireAuth, requireRole("employer"), async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Could not load your jobs" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid job ID" });
    const job = await Job.findById(req.params.id).populate("postedBy", "companyName name");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Could not load job details" });
  }
});

router.post("/", requireAuth, requireRole("employer"), async (req, res) => {
  try {
    const { title, description, requirements, location, salaryRange } = req.body;
    if (typeof title !== "string" || !title.trim() || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ message: "Title and description are required" });
    }
    const job = await Job.create({
      title: title.trim(), description: description.trim(),
      requirements: parseRequirements(requirements),
      location: typeof location === "string" ? location.trim() : "",
      salaryRange: typeof salaryRange === "string" ? salaryRange.trim() : "",
      postedBy: req.user._id
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: "Could not create job" });
  }
});

router.patch("/:id", requireAuth, requireRole("employer"), async (req, res) => {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid job ID" });
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found" });
    const { title, description, location, salaryRange, requirements, status } = req.body;
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) return res.status(400).json({ message: "Title cannot be empty" });
      job.title = title.trim();
    }
    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) return res.status(400).json({ message: "Description cannot be empty" });
      job.description = description.trim();
    }
    if (location !== undefined) job.location = typeof location === "string" ? location.trim() : job.location;
    if (salaryRange !== undefined) job.salaryRange = typeof salaryRange === "string" ? salaryRange.trim() : job.salaryRange;
    if (requirements !== undefined) job.requirements = parseRequirements(requirements);
    if (status !== undefined) {
      if (!["open", "closed"].includes(status)) return res.status(400).json({ message: "Invalid job status" });
      job.status = status;
    }
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Could not update job" });
  }
});
module.exports = router;
