const User = require('../models/User');
const Company = require('../models/Company');

exports.addCompanyMember = async (req, res) => {
  try {
    const { email, role = 'EMPLOYEE' } = req.body;
    
    // Verify requester is company owner
    const company = await Company.findOne({ 
      _id: req.user.companyId, 
      owner: req.user.id 
    });
    
    if (!company) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    console.log(company, "company", email, "email", role, "role");
    // Find user by email
    let user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    
    if (!user) {
      return res.status(404).json({ error: 'User not found in add company' });
    }

    // Check if user is already in a company
    if (user.companyId) {
      return res.status(400).json({ error: 'User already belongs to a company' });
    }

    // Update user's role and company
    user.role = role;
    user.companyId = company._id;
    await user.save();

    // Add user to company members
    company.members.push(user._id);
    await company.save();

    res.json({ 
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      company 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.promoteToProjectManager = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Verify requester is company owner
    const company = await Company.findOne({ 
      _id: req.user.companyId, 
      owner: req.user.id 
    });
    
    if (!company) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Find user
    const user = await User.findOne({
      _id: userId,
      companyId: company._id
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in promotion to manager' });
    }

    // Promote to project manager
    user.role = 'PROJECT_MANAGER';
    await user.save();

    res.json({ 
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};