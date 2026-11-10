
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!process.env.MONGO_URI || !email || !password) {
      throw new Error(
        "MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD are required"
      );
    }

    if (password.length < 12) {
      throw new Error(
        "Admin password must be at least 12 characters"
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Account already exists. No changes made.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: "CareerFlow Admin",
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin account created successfully!");
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
