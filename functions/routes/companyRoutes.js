const express = require('express');
const router = express.Router();
const authMiddleware = require('../config/authMiddleware');
const { 
  addCompanyMember, 
  promoteToProjectManager,
  getCompanyEmployees
} = require('../controllers/companyController');

// Protected Routes
router.post('/add-member', authMiddleware, addCompanyMember);
router.post('/promote-project-manager', authMiddleware, promoteToProjectManager);
router.get('/employees', authMiddleware, getCompanyEmployees);

module.exports = router;