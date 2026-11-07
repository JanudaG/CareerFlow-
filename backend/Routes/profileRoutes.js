const express = require("express");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("jobseeker"));

router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -__v");

    if (!user) {
      return res.status(404).json({
        message: "Profile not found.",
      });
    }

    res.json(user);
  } catch {
    res.status(500).json({
      message: "Could not load profile.",
    });
  }
});

router.put("/", async (req, res) => {
  try {
    const allowed = [
      "name",
      "university",
      "degree",
      "field",
      "gpa",
      "graduationYear",
      "bio",
      "experience",
      "skills",
      "resumeLink",
    ];

    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.name !== undefined) {
      if (
        typeof updates.name !== "string" ||
        !updates.name.trim()
      ) {
        return res.status(400).json({
          message: "Valid name is required.",
        });
      }
      updates.name = updates.name.trim();
    }

    if (updates.gpa !== undefined) {
      const value = Number(updates.gpa);
      if (
        updates.gpa === "" ||
        updates.gpa === null
      ) {
        updates.gpa = null;
      } else if (
        !Number.isFinite(value) ||
        value < 0 ||
        value > 4
      ) {
        return res.status(400).json({
          message: "GPA must be between 0 and 4.",
        });
      } else {
        updates.gpa = value;
      }
    }

    if (updates.graduationYear !== undefined) {
      const year = Number(updates.graduationYear);

      if (
        updates.graduationYear === "" ||
        updates.graduationYear === null
      ) {
        updates.graduationYear = null;
      } else if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > 2200
      ) {
        return res.status(400).json({
          message: "Invalid graduation year.",
        });
      } else {
        updates.graduationYear = year;
      }
    }

    if (updates.skills !== undefined) {
      if (!Array.isArray(updates.skills)) {
        return res.status(400).json({
          message: "Skills must be an array.",
        });
      }

      updates.skills = [...new Set(
        updates.skills
          .filter((s) => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean)
      )].slice(0, 30);
    }

    for (const key of [
      "university", "degree", "field",
      "bio", "experience", "resumeLink",
    ]) {
      if (
        updates[key] !== undefined &&
        typeof updates[key] !== "string"
      ) {
        return res.status(400).json({
          message: `${key} must be a string.`,
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -__v");

    res.json(user);
  } catch (err) {
    res.status(400).json({
      message: err.message || "Could not update profile.",
    });
  }
});

module.exports = router;
