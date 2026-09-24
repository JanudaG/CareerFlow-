const express = require('express');
const Job = require('../models/Job');

const router = express.Router();

// CREATE a job (employer posts a job)
router.post('/', async (req, res) => {
  try {
    const { title, description, requirements, location, salaryRange, postedBy } = req.body;

    const newJob = new Job({
      title,
      description,
      requirements,
      location,
      salaryRange,
      postedBy,
    });

    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET all jobs (browse/search)
router.get('/', async (req, res) => {
  try {
    const { search, location } = req.query;
    let filter = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' }; // case-insensitive search by title
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    const jobs = await Job.find(filter).populate('postedBy', 'companyName');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET a single job by ID (view job details)
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'companyName');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;