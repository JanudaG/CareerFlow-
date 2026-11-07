const express = require("express");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/stats", async (req, res) => {
  try {
    const [
      totalJobSeekers,
      totalCompanies,
      totalJobs,
      totalApplications,
    ] = await Promise.all([
      User.countDocuments({ role: "jobseeker" }),
      User.countDocuments({ role: "employer" }),
      Job.countDocuments(),
      Application.countDocuments(),
    ]);

    res.json({
      totalJobSeekers,
      totalCompanies,
      totalJobs,
      totalApplications,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Failed to load statistics" });
  }
});

router.get("/jobseekers", async (req, res) => {
  try {
    const jobseekers = await User.find({ role: "jobseeker" })
      .select("name email university degree field gpa skills createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(jobseekers);
  } catch (error) {
    console.error("Admin jobseekers error:", error);
    res.status(500).json({ message: "Failed to load job seekers" });
  }
});

router.get("/companies", async (req, res) => {
  try {
    const companies = await User.find({ role: "employer" })
      .select("name email companyName companyDescription createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(companies);
  } catch (error) {
    console.error("Admin companies error:", error);
    res.status(500).json({ message: "Failed to load companies" });
  }
});

router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("postedBy", "name email companyName")
      .sort({ createdAt: -1 })
      .lean();

    res.json(jobs);
  } catch (error) {
    console.error("Admin jobs error:", error);
    res.status(500).json({ message: "Failed to load jobs" });
  }
});

router.get("/applications", async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("applicant", "name email")
      .populate({
        path: "job",
        select: "title status postedBy",
        populate: {
          path: "postedBy",
          select: "name companyName",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(applications);
  } catch (error) {
    console.error("Admin applications error:", error);
    res.status(500).json({ message: "Failed to load applications" });
  }
});

module.exports = router;
