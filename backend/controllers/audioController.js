const Meetings = require('../models/Meeting');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Upload audio and store data
exports.uploadAudio = async (req, res) => {
  try {
    const { roomId, timestamps, isLast } = req.body;
    const userId = req.params.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Save audio file path
    const audioUrl = `${process.env.BACKEND_URL}/uploads/audios/${userId}.webm`;

    // Save data to MongoDB
    const meetingData = new Meetings({
      roomId,
      userId,
      audioUrl,
      timestamps: JSON.parse(timestamps),
      isLast: isLast === 'true',
    });

    await meetingData.save();

    return res.status(201).json({
      message: 'Audio uploaded successfully',
      audioUrl,
    });
  } catch (error) {
    console.error('Error uploading audio:', error.message);
    res.status(500).json({ error: error.message });
  }
};


exports.processAudio = async (req, res) => {
  let roomId = req.params.roomId; // Declare roomId at the top
  roomId = roomId.slice(1); // Remove the first character

  try {
    console.log(`Processing audio for roomId: ${roomId}`);
    console.log('RoomId type:', typeof roomId);

    // Add more detailed logging
    console.log('Full request params:', req.params);
    console.log('Exact query being made:', { roomId });

    // Consider using findOne or adding more logging
    const meetingFiles = await Meetings.find({ roomId });
    
    console.log('Number of meeting files found:', meetingFiles.length);
    console.log('Actual meeting files:', meetingFiles);
    console.log()
    // Prepare data for merge-audio endpoint
    const mergeAudioData = {
      data: meetingFiles.map(file => ({
        userID: file.userId.slice(0),
        audioURL: file.audioUrl,
        timestamps: file.timestamps || [],
        // projectId: "12345", // Static project ID for now
      })),
    };

    console.log('Merge audio data:', mergeAudioData);

    // Send request to merge-audio endpoint
    const mergeResponse = await axios.post('http://172.31.0.45:8000/merge-audio', mergeAudioData);

    console.log('Merge audio response:', mergeResponse.data);
  } catch (mergeError) {
    console.error('Error in merge-audio request:', mergeError.message);
  }

  console.log(`Final audio uploaded for roomId: ${roomId}`); // roomId is now accessible
};
