const mongoose = require('mongoose');

// Define User Schema
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    profile: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
    },
    role: {
      type: String,
      enum: ['EMPLOYEE', 'COMPANY_OWNER', 'PROJECT_MANAGER', 'ADMIN'],
      default: 'EMPLOYEE',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    managedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to ensure unique email
UserSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existingUser = await this.constructor.findOne({ email: this.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
