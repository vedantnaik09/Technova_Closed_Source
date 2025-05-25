// models/Company.js
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  departments: [{
    name: String,
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  subscriptionTier: {
    type: String,
    enum: ['BASIC', 'PROFESSIONAL', 'ENTERPRISE'],
    default: 'BASIC'
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);