const express = require('express');
const router = express.Router();
const authMiddleware = require('../config/authMiddleware');
const { 
  createProject, 
  addProjectMember, 
  removeProjectMember,
  getProjectManagers, // Make sure this is imported
  getProjectEmployees ,
  getProjects
} = require('../controllers/projectController');

// Routes
router.get('/', authMiddleware, getProjects);
router.post('/create', authMiddleware, createProject);
router.post('/add-member', authMiddleware, addProjectMember);
router.post('/remove-member', authMiddleware, removeProjectMember);
router.get('/project-managers', authMiddleware, getProjectManagers);
router.get('/employees/:projectId', authMiddleware, getProjectEmployees);

module.exports = router;