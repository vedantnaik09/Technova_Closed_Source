const Project = require('../models/Project');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.getProjects = async (req, res) => {
  try {
    // Fetch all projects for the company
    const projects = await Project.find({ 
      companyId: req.user.companyId 
    }).select('_id name');

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, projectManagerId } = req.body;
    
    // Verify project manager belongs to the same company
    const projectManager = await User.findOne({
      _id: projectManagerId,
      companyId: req.user.companyId,
      role: 'PROJECT_MANAGER'
    });

    if (!projectManager) {
      return res.status(400).json({ error: 'Invalid project manager' });
    }

    // Create project
    const project = new Project({
      name,
      description,
      companyId: req.user.companyId,
      projectManager: projectManagerId,
      status: 'PLANNING'
    });

    await project.save();

    // Add project to project manager's managed projects
    projectManager.managedProjects.push(project._id);
    await projectManager.save();

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getProjectEmployees = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const project = await Project.findById(projectId).populate('employees', 'profile email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ employees: project.employees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectManagers = async (req, res) => {
  try {
    // Find all project managers in the same company
    const projectManagers = await User.find({
      companyId: req.user.companyId,
      role: 'PROJECT_MANAGER'
    }).select('profile email'); // Select only necessary fields

    res.json(projectManagers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeProjectMember = async (req, res) => {
  try {
    const { projectId, userId } = req.body;

    // Find project 
    const project = await Project.findOne({
      _id: projectId,
      companyId: req.user.companyId,
      projectManager: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    // Remove user from project team
    project.team = project.team.filter(id => id.toString() !== userId);
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addProjectMember = async (req, res) => {
  try {
    const { projectId, userId } = req.body;

    console.log(projectId, userId,req.user.companyId);
    
    // Verify the project exists and belongs to the user's company
    const project = await Project.findOne({ 
      _id: projectId, 
      companyId: req.user.companyId.toString(),
    });
    console.log(project);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    
    // Check if user is already a member
    if (project.employees.includes(userId)) {
      return res.status(400).json({ error: 'Employee is already a member of this project' });
    }
    
    // Add user to project members
    project.employees.push(userId);
    await project.save();
    
    // Optionally, update user's managedProjects if applicable
    await User.findByIdAndUpdate(userId, {
      $addToSet: { managedProjects: projectId }
    });
    
    res.status(200).json({ 
      message: 'Employee added to project successfully',
      project 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

