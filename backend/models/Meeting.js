const mongoose = require('mongoose');

// Define Meeting Schema
const MeetingSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      required: true,
    },
    timestamps: [
      {
        start: Number,
        end: Number,
      },
    ],
    isLast: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Meeting', MeetingSchema);
