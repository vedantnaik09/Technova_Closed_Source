// controllers/taskController.js
const Task = require('../models/Task');
const AIService = require('../services/aiService');
const mongoose = require('mongoose');

exports.createTask = async (req, res) => {
  try {
    const { 
      projectId, 
      title, 
      description, 
      assignedTo, 
      priority 
    } = req.body;
    
    const task = new Task({
      projectId,
      title,
      description,
      assignedTo,
      priority,
      status: 'TODO',
      aiMetadata: {
        createdBy: 'HUMAN',
        confidenceScore: 1.0
      }
    });

    await task.save();

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignAITask = async (req, res) => {
  try {
    const { projectId, meetingData } = req.body;
    
    const task = await AIService.assignTask(projectId, meetingData);
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id, 
      { 
        status,
        actualHours: req.body.actualHours
      }, 
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserTasks = async (req, res) => {
  try {
    const userId = req.params.userId; // Get user ID from URL parameters
    console.log(userId);

    // Validate that the userId is a valid string (no need to convert to ObjectId)
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Query tasks where assignedTo matches the userId as a string
    const tasks = await Task.find({assignedTo: "6794ef7fe8c692c5bf483660"})
      .populate('projectId', 'name')
      .populate('assignedTo', 'username email');

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching user tasks:", error.message);
    res.status(500).json({ error: error.message });
  }
};