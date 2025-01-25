const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found in auth' });
    }

    // Attach user and decoded token to request
    req.token = token;
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};