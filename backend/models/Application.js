
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: [
      "submitted",
      "reviewing",
      "shortlisted",
      "interview",
      "offered",
      "rejected",
      "withdrawn",
      "Applied",
      "Under Review",
      "Interview",
      "Accepted",
      "Rejected",
    ],
    default: "submitted",
  },
  coverNote: {
    type: String,
    default: "",
    maxlength: 1000,
  },
}, { timestamps: true });

applicationSchema.index(
  { job: 1, applicant: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Application",
  applicationSchema
);

