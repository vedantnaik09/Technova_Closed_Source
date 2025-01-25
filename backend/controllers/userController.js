const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // Create a new user as EMPLOYEE by default
    const user = new User({
      email,
      profile: { firstName, lastName },
      role: 'EMPLOYEE',
    });

    const newUser = await user.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found in login' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const { name, domain } = req.body;
    const user = await User.findById(req.user.id);

    // Create company
    const company = new Company({
      name,
      domain,
      owner: user._id,
      members: [user._id],
    });
    await company.save();

    // Update user to COMPANY_OWNER and set companyId
    user.role = 'COMPANY_OWNER';
    user.companyId = company._id;
    await user.save();

    res.status(201).json({ company, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};