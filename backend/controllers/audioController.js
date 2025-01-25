const Meeting = require('../models/Meeting');
const path = require('path');
const fs = require('fs');

// Upload audio and store data
exports.uploadAudio = async (req, res) => {
  try {
    const { roomId, timestamps, isLast } = req.body;
    const userId = req.params.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Save audio file path
    const audioUrl = `${process.env.BACKEND_URL}/uploads/audios/${userId}.mp3`;

    // Save data to MongoDB
    const meetingData = new Meeting({
      roomId,
      userId,
      audioUrl,
      timestamps: JSON.parse(timestamps),
      isLast: isLast === 'true',
    });

    await meetingData.save();

    // If it's the last chunk, log a message
    if (isLast === 'true') {
      console.log(`Final audio uploaded for userId: ${userId}, roomId: ${roomId}`);
    }

    return res.status(201).json({
      message: 'Audio uploaded successfully',
      audioUrl,
    });
  } catch (error) {
    console.error('Error uploading audio:', error.message);
    res.status(500).json({ error: error.message });
  }
};
