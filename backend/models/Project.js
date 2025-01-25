// models/Project.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
    default: 'PLANNING'
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    estimatedDuration: Number
  },
  budget: {
    total: Number,
    spent: Number
  },
  aiInsights: {
    workloadDistribution: mongoose.Schema.Types.Mixed,
    communicationEfficiency: Number,
    potentialBottlenecks: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);