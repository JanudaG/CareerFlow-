
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ==========================================
// REGISTER
// ==========================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      companyName,
      companyDescription,
    } = req.body || {};

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Enter a valid name, email and password (minimum 8 characters).",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const validRoles = ["jobseeker", "employer"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid user role",
      });
    }

    if (
      role === "employer" &&
      (
        typeof companyName !== "string" ||
        !companyName.trim()
      )
    ) {
      return res.status(400).json({
        message: "Company name is required",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      companyName:
        role === "employer"
          ? companyName.trim()
          : undefined,
      companyDescription:
        role === "employer" &&
        typeof companyDescription === "string"
          ? companyDescription.trim()
          : undefined,
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("Register error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
});

// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Validate login input
    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // IMPORTANT:
    // Explicitly retrieve password even if
    // User model uses select: false.
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user || typeof user.password !== "string") {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Return token and user details
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
});

module.exports = router;
