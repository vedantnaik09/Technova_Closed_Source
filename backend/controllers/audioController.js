const Meetings = require('../models/Meeting');
const axios = require('axios');
const multer = require('multer');
const { audioStorage } = require('../config/cloudinary');

// Configure multer with Cloudinary storage
const upload = multer({ storage: audioStorage });

// Upload audio and store data
exports.uploadAudio = async (req, res) => {
  try {
    const { roomId, timestamps, isLast } = req.body;
    const userId = req.params.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Cloudinary automatically provides the secure URL
    const audioUrl = req.file.path;

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

// Export the multer upload middleware
exports.uploadAudioMiddleware = upload.single('audio');

// Keep the existing processAudio function unchanged
exports.processAudio = async (req, res) => {
  let roomId = req.params.roomId;
  roomId = roomId.slice(1);

  try {
    console.log(`Processing audio for roomId: ${roomId}`);
    
    const meetingFiles = await Meetings.find({ roomId });
    console.log('Number of meeting files found:', meetingFiles.length);

    const mergeAudioData = {
      data: meetingFiles.map(file => ({
        userID: file.userId.slice(0),
        audioURL: file.audioUrl,
        timestamps: file.timestamps || [],
      })),
    };

    console.log('Merge audio data:', mergeAudioData);

    const mergeResponse = await axios.post(`${process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'}/merge-audio`, mergeAudioData);
    console.log('Merge audio response:', mergeResponse.data);
  } catch (mergeError) {
    console.error('Error in merge-audio request:', mergeError.message);
  }

  console.log(`Final audio uploaded for roomId: ${roomId}`);
};
