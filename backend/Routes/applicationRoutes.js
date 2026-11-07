const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Applicants can see only their own applications.
router.get("/mine", requireAuth, requireRole("jobseeker"), async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({ path: "job", select: "title location salaryRange status postedBy", populate: { path: "postedBy", select: "companyName name" } })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Could not load applications" });
  }
});

// Employer can see applicants only for jobs they own.
router.get("/job/:jobId", requireAuth, requireRole("employer"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) return res.status(400).json({ message: "Invalid job ID" });
    const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found" });
    const applications = await Application.find({ job: job._id })
      .populate("applicant", "name email skills resumeLink bio")
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Could not load applicants" });
  }
});

router.post("/:jobId", requireAuth, requireRole("jobseeker"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) return res.status(400).json({ message: "Invalid job ID" });
    const job = await Job.findById(req.params.jobId);
    if (!job || job.status !== "open") return res.status(404).json({ message: "Open job not found" });
    const existing = await Application.findOne({ job: job._id, applicant: req.user._id });
    if (existing) return res.status(409).json({ message: "You already applied to this job" });
    const application = await Application.create({ job: job._id, applicant: req.user._id });
    res.status(201).json(application);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "You already applied to this job" });
    res.status(500).json({ message: "Could not submit application" });
  }
});

router.patch("/:applicationId/status", requireAuth, requireRole("employer"), async (req, res) => {
  try {
    const allowed = ["Applied", "Under Review", "Interview", "Accepted", "Rejected"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid application status" });
    if (!mongoose.isValidObjectId(req.params.applicationId)) return res.status(400).json({ message: "Invalid application ID" });
    const application = await Application.findById(req.params.applicationId).populate("job", "postedBy");
    if (!application || !application.job) return res.status(404).json({ message: "Application not found" });
    if (String(application.job.postedBy) !== String(req.user._id)) return res.status(403).json({ message: "Insufficient permissions" });
    application.status = req.body.status;
    await application.save();
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: "Could not update application" });
  }
});

module.exports = router;
