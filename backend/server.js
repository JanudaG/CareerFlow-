const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./Routes/authRoutes");
const jobRoutes = require("./Routes/jobRoutes");
const applicationRoutes = require("./Routes/applicationRoutes");
const profileRoutes = require("./Routes/profileRoutes");
const matchRoutes = require("./Routes/matchRoutes");
const adminRoutes = require("./Routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (_req, res) => {
  res.send("CareerFlow API is running");
});

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error(
    "Set JWT_SECRET and MONGO_URI before starting the backend"
  );
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "MongoDB connection error:",
      err.message
    );
    process.exit(1);
  });
