const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadAudio, processAudio, uploadAudioMiddleware } = require('../controllers/audioController');

const router = express.Router();

// Multer configuration for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads/audios'));
    },
    filename: (req, file, cb) => {
      const userId = req.params.userId.replace(':', ''); // Remove colon if present
      cb(null, `${userId}.webm`);
    },
  });
  

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /webm/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .webm files are allowed'));
    }
  },
});

// POST route for audio upload
router.post('/upload/:userId', uploadAudioMiddleware, uploadAudio);
router.post('/process/:roomId', processAudio);

module.exports = router;
