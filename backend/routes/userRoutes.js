const express = require('express');
const router = express.Router();
const authMiddleware = require('../config/authMiddleware');
const {
  registerUser,
  loginUser,
  createCompany,
  getAllEmployees
} = require('../controllers/userController');
const User = require('../models/User');
const multer = require('multer');
const { resumeStorage } = require('../config/cloudinary');

// Configure multer with Cloudinary storage for resumes
const upload = multer({ 
  storage: resumeStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
});

// Resume upload route
router.post('/upload-resume', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cloudinary automatically provides the secure URL
    user.resume = req.file.path;
    await user.save();

    res.json({ message: 'Resume uploaded successfully', resumeUrl: user.resume });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/employee', authMiddleware, getAllEmployees);

// Protected Routes
router.post('/create-company', authMiddleware, createCompany);

module.exports = router;
