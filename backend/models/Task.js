// models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: { type: String, required: true },
  description: String,
  assignedTo: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'],
    default: 'TODO'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  estimatedHours: Number,
  actualHours: Number,
  aiMetadata: {
    createdBy: {
      type: String,
      enum: ['HUMAN', 'AI', 'SYSTEM'],
      default: 'HUMAN'
    },
    confidenceScore: Number,
    skillMatchScore: {
      assignedUser: Number,
      alternateUsers: [{
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        matchPercentage: Number
      }]
    }
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  attachments: [String],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);