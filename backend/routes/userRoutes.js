const express = require('express');
const router = express.Router();
const authMiddleware = require('../config/authMiddleware');
const {
  registerUser,
  loginUser,
  createCompany,
} = require('../controllers/userController');

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Routes
router.post('/create-company', authMiddleware, createCompany);

module.exports = router;
