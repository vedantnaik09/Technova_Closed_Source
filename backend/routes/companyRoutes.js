const express = require('express');
const router = express.Router();
const authMiddleware = require('../config/authMiddleware');
const { 
  addCompanyMember, 
  promoteToProjectManager 
} = require('../controllers/companyController');

// Protected Routes
router.post('/add-member', authMiddleware, addCompanyMember);
router.post('/promote-project-manager', authMiddleware, promoteToProjectManager);

module.exports = router;