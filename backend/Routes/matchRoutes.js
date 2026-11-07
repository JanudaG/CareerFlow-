
const express = require("express");
const Job = require("../models/Job");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function calculateMatch(user, job) {
  const userSkills = new Set(
    (user.skills || []).map(normalize).filter(Boolean)
  );

  const requiredSkills = [
    ...new Set(
      (job.requirements || [])
        .map(normalize)
        .filter(Boolean)
    ),
  ];

  const matchedSkills = requiredSkills.filter(
    (skill) => userSkills.has(skill)
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !userSkills.has(skill)
  );

  const score = requiredSkills.length
    ? Math.round(
        (matchedSkills.length / requiredSkills.length) * 100
      )
    : 0;

  return {
    score,
    matchedSkills,
    missingSkills,
  };
}

router.get(
  "/mine",
  requireAuth,
  requireRole("jobseeker"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      const jobs = await Job.find({
        status: "open",
        $or: [
          { closingDate: { $exists: false } },
          { closingDate: null },
          { closingDate: { $gte: new Date() } },
        ],
      })
        .populate("postedBy", "name companyName")
        .sort({ createdAt: -1 });

      const matches = jobs.map((job) => ({
        _id: String(job._id),
        job,
        internship: job,
        ...calculateMatch(user, job),
      }));

      matches.sort(
        (a, b) =>
          b.score - a.score ||
          new Date(b.job.createdAt) - new Date(a.job.createdAt)
      );

      res.json(matches.slice(0, 20));
    } catch {
      res.status(500).json({
        message: "Could not calculate job matches.",
      });
    }
  }
);

module.exports = router;
