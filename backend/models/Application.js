const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['Applied', 'Under Review', 'Interview', 'Accepted', 'Rejected'],
    default: 'Applied',
  },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
