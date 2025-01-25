// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createTask, 
  assignAITask, 
  updateTaskStatus,
  getUserTasks
} = require('../controllers/taskController');
const authMiddleware = require('../config/authMiddleware');

// Protected routes
router.post('/', authMiddleware, createTask);
router.post('/ai-assign', authMiddleware, assignAITask);
router.put('/:id/status', authMiddleware, updateTaskStatus);
router.get('/my-tasks', authMiddleware, getUserTasks);

module.exports = router;