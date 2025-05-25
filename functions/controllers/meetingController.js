// controllers/meetingController.js
const Meeting = require('../models/Meeting');
const AIService = require('../services/aiService');

exports.scheduleMeeting = async (req, res) => {
  try {
    const { 
      projectId, 
      title, 
      scheduledTime, 
      duration, 
      participants, 
      type 
    } = req.body;
    
    const meeting = new Meeting({
      projectId,
      title,
      scheduledTime,
      duration,
      participants,
      type
    });

    await meeting.save();

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateMeetingMinutes = async (req, res) => {
  try {
    const meetingId = req.params.id;
    
    const aiMinutes = await AIService.generateMeetingMinutes(meetingId);
    
    const meeting = await Meeting.findByIdAndUpdate(
      meetingId, 
      { aiGeneratedMinutes: aiMinutes }, 
      { new: true }
    );

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ 
      projectId: req.params.projectId 
    }).populate('participants', 'profile.firstName profile.lastName');
    
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};