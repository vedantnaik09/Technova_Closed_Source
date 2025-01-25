// models/Meeting.js
const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: ['DAILY_STANDUP', 'SPRINT_PLANNING', 'REVIEW', 'RETROSPECTIVE'],
    default: 'DAILY_STANDUP'
  },
  aiGeneratedMinutes: {
    summary: String,
    actionItems: [String],
    sentimentAnalysis: {
      overallMood: String,
      engagementLevel: Number
    }
  },
  recordingUrl: String,
  transcriptUrl: String
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);