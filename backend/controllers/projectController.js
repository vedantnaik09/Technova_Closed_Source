const Project = require('../models/Project');
const User = require('../models/User');

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

exports.addProjectMember = async (req, res) => {
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

    // Find user
    const user = await User.findOne({
      _id: userId,
      companyId: req.user.companyId
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in add project member' });
    }

    // Add user to project team if not already present
    if (!project.team.includes(userId)) {
      project.team.push(userId);
      await project.save();
    }

    res.json(project);
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