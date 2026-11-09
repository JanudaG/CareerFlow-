
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
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

    // Email supplied by applicant during application
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    // Phone supplied by applicant during application
    contactPhone: {
      type: String,
      required: [true, "Contact phone number is required"],
      trim: true,
      validate: {
        validator: function (value) {
          if (typeof value !== "string") {
            return false;
          }

          const normalized = value.replace(
            /[\s().-]/g,
            ""
          );

          return /^\+?[0-9]{7,15}$/.test(normalized);
        },
        message: "Please enter a valid phone number",
      },
    },

    coverNote: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications to the same job
applicationSchema.index(
  { job: 1, applicant: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Application",
  applicationSchema
);
