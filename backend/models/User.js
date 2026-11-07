
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ["jobseeker", "employer"],
    required: true,
  },

  bio: { type: String, default: "", maxlength: 1000 },
  skills: { type: [String], default: [] },
  resumeLink: { type: String, default: "" },

  university: { type: String, default: "" },
  degree: { type: String, default: "" },
  field: { type: String, default: "" },
  gpa: { type: Number, min: 0, max: 4 },
  graduationYear: { type: Number },
  experience: { type: String, default: "", maxlength: 1500 },

  companyName: { type: String, default: "" },
  companyDescription: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
