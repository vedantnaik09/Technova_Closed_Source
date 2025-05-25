const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Environment-specific CORS
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local port
  'http://localhost:5001', // Functions emulator
  'http://localhost:5000', // Hosting emulator
];

// Add production URLs dynamically
const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
if (projectId) {
  allowedOrigins.push(
    `https://${projectId}.web.app`,
    `https://${projectId}.firebaseapp.com`
  );
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// For Firebase Functions, we'll handle file storage differently
// But we can still serve files if they exist locally (for emulator)
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  // Only create directories when running in emulator
  app.use('/uploads/resume', express.static(path.join(__dirname, 'uploads/resume')));
  const audioDir = path.join(__dirname, 'uploads/audios');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
    console.log('Directory created:', audioDir);
  }
  app.use('/uploads/audios', express.static(path.join(__dirname, 'uploads/audios')));
}

// Import routes directly from functions folder
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/audios', require('./routes/audioRoutes'));

// Database Connection using Firebase Functions config
const connectDB = async () => {
  try {
    let mongoUri;
    
    // Try Firebase Functions config first, then fallback to env
    try {
      mongoUri = functions.config().mongodb?.uri;
    } catch (e) {
      // Fallback to environment variable for local development
      mongoUri = process.env.MONGODB_URI;
    }
    
    if (!mongoUri) {
      console.error('MongoDB URI not found. Please set it using: firebase functions:config:set mongodb.uri="your_uri"');
      return;
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

connectDB();

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!', message: err.message });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Firebase Functions API is up and running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Export the main API function
exports.api = functions.https.onRequest(app);

// Export health check function
exports.health = functions.https.onRequest((req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Firebase Functions are running'
  });
});