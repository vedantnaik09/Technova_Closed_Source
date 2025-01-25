const express = require('express');
const router = express.Router();
const authMiddleware = require('../config/authMiddleware');
const { 
  createProject, 
  addProjectMember, 
  removeProjectMember 
} = require('../controllers/projectController');

// Protected Routes
router.post('/', authMiddleware, createProject);
router.post('/add-member', authMiddleware, addProjectMember);
router.post('/remove-member', authMiddleware, removeProjectMember);

module.exports = router;