const express = require('express');
const router = express.Router();
const authMiddleware = require('../config/authMiddleware');
const {
  registerUser,
  loginUser,
  createCompany,
} = require('../controllers/userController');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/resume/'));
  },
  filename: (req, file, cb) => {
    const userId = req.user.id; // Assuming user ID is available in req.user
    cb(null, `${userId}.pdf`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
});

// Add a resume upload route
router.post('/upload-resume', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's resume field
    user.resume = `${process.env.BACKEND_URL}/uploads/resume/${req.user.id}.pdf`;
    await user.save();

    res.json({ message: 'Resume uploaded successfully', resumeUrl: user.resume });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Routes
router.post('/create-company', authMiddleware, createCompany);

module.exports = router;
