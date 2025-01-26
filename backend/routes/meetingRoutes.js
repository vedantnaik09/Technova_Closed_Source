// routes/meetingRoutes.js
const express = require('express');
const router = express.Router();
const { 
  scheduleMeeting, 
  generateMeetingMinutes,
  getProjectMeetings
} = require('../controllers/meetingController');
const authMiddleware = require('../config/authMiddleware');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Project = require('../models/Project');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your preferred email service
  auth: {
    user: process.env.sender_email,
    pass: process.env.sender_password,
  }
});


// Protected routes
router.post('/', authMiddleware, scheduleMeeting);
router.post('/:id/minutes', authMiddleware, generateMeetingMinutes);
router.get('/project/:projectId', authMiddleware, getProjectMeetings);

router.post('/schedule', authMiddleware, async (req, res) =>  {
    const userId = req.body.userId;
    const roomId = req.body.roomId;
    const projectId = req.body.projectId;
    const participants = req.body.participants;
    const project = await Project.findById(projectId);

    // Find user details for sender
    const sender = await User.findById(userId);

    // Find participant emails
    const participantUsers = await User.find({ 
      _id: { $in: participants } 
    });

    console.log("here")
  const emailPromises = participantUsers.map(participant => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: participant.email,
      subject: `Meeting Invitation - ${project.name}`,
      html: `
        <h2>Meeting Invitation</h2>
        <p>You have been invited to a meeting by ${sender.profile.firstName} ${sender.profile.lastName}</p>
        <p>Project: ${project.name}</p>
        <p>Meeting Link: ${process.env.FRONTEND_URL}/employeeMeet?${roomId}</p>
        <p>Join using this unique meeting ID: <strong>${roomId}</strong></p>
      `
    };

    return transporter.sendMail(mailOptions);

  });

  // Send all emails
  await Promise.all(emailPromises);
  console.log("here finally")
  
});

module.exports = router;