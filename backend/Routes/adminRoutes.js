
const express = require("express");

const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");

const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");

const router = express.Router();

// All routes below require an authenticated admin
router.use(requireAuth, requireRole("admin"));

// GET /api/admin/stats
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

    res.status(200).json({
      totalJobSeekers,
      totalCompanies,
      totalJobs,
      totalApplications,
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).json({
      message: "Could not load admin statistics",
    });
  }
});

module.exports = router;
