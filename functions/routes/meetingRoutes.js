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

router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const userId = req.body.userId;
    const roomId = req.body.roomId;
    const projectId = req.body.projectId;
    const participants = req.body.participants;

    // Fetch project details
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch sender details
    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // Fetch participant details
    const participantUsers = await User.find({ _id: { $in: participants } });
    if (participantUsers.length === 0) {
      return res.status(404).json({ error: 'No participants found' });
    }

    console.log("Starting email sending process...");
    const emailPromises = participantUsers.map(participant => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: participant.email,
        subject: `Meeting Invitation - ${project.name}`,
        html: `
          <h2>Meeting Invitation</h2>
          <p>You have been invited to a meeting by ${sender.profile.firstName} ${sender.profile.lastName}</p>
          <p>Project: ${project.name}</p>
          <p>Meeting Link: ${process.env.FRONTEND_URL}/employeeMeet?id=${roomId}</p>
          <p>Join using this unique meeting ID: <strong>${roomId}</strong></p>
        `
      };

      return transporter.sendMail(mailOptions);
    });

    // Send all emails
    await Promise.all(emailPromises);
    console.log("Emails sent successfully.");

    // Send a success response
    res.status(200).json({ message: 'Meeting invitations sent successfully' });
  } catch (error) {
    console.error('Error sending meeting invitations:', error);
    res.status(500).json({ error: 'An error occurred while sending meeting invitations' });
  }
});


module.exports = router;