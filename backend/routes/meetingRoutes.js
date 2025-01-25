// routes/meetingRoutes.js
const express = require('express');
const router = express.Router();
const { 
  scheduleMeeting, 
  generateMeetingMinutes,
  getProjectMeetings
} = require('../controllers/meetingController');
const authMiddleware = require('../config/authMiddleware');

// Protected routes
router.post('/', authMiddleware, scheduleMeeting);
router.post('/:id/minutes', authMiddleware, generateMeetingMinutes);
router.get('/project/:projectId', authMiddleware, getProjectMeetings);

module.exports = router;