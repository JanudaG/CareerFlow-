
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  requirements: { type: [String], default: [] },
  location: { type: String, default: "" },
  salaryRange: { type: String, default: "" },

  preferredField: { type: String, default: "" },
  preferredDegree: { type: String, default: "Any" },
  minimumGpa: { type: Number, min: 0, max: 4 },
  openings: { type: Number, min: 1, default: 1 },
  closingDate: { type: Date },

  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open",
  },
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);
