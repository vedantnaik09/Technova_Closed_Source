const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const path = require('path');
const fs = require('fs');

app.use(cors());
app.use(express.json());
app.use('/uploads/resume', express.static(path.join(__dirname, 'uploads/resume')));
const audioDir = path.join(__dirname, 'uploads/audios');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log('Directory created:', audioDir);
}
app.use('/uploads/audios', express.static(path.join(__dirname, 'uploads/audios')));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/audios', require('./routes/audioRoutes'));

// AI Proxy Setup - Forward AI requests to Python server
const aiProxy = createProxyMiddleware({
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
  pathRewrite: {
    '^/ai': '', // Remove /ai prefix when forwarding
  },
  onError: (err, req, res) => {
    console.error('[AI PROXY ERROR]:', err.message);
    res.status(503).json({ 
      error: 'AI service temporarily unavailable',
      message: 'Python server may still be starting up'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] ${req.method} ${req.url} -> Python server`);
  }
});

app.use('/ai', aiProxy);

// Function to start Python FastAPI server
function startPythonServer() {
  const pythonPath = path.join(__dirname, '..', 'AI', 'Models');
  console.log(`[PYTHON] Starting Python server from: ${pythonPath}`);
  
  const pythonProcess = spawn('python3', ['main.py'], {
    cwd: pythonPath,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { 
      ...process.env, 
      PORT: '8000',
      PYTHONPATH: pythonPath,
      PYTHONUNBUFFERED: '1'
    }
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[PYTHON] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[PYTHON ERROR] ${data.toString().trim()}`);
  });

  pythonProcess.on('error', (err) => {
    console.error('[PYTHON] Failed to start Python server:', err);
  });

  pythonProcess.on('close', (code) => {
    console.log(`[PYTHON] Server exited with code ${code}`);
    if (code !== 0) {
      console.error('[PYTHON] Server crashed, attempting restart in 5 seconds...');
      setTimeout(startPythonServer, 5000);
    }
  });

  return pythonProcess;
}

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      nodeServer: 'running',
      timestamp: new Date().toISOString()
    }
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use('/', (req, res) => {
  res.send('Node.js + Python AI Server is running');
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[NODE] Server running on port ${PORT}`);
  
  // Start Python server after Node.js is ready
  setTimeout(() => {
    console.log('[STARTUP] Starting Python AI server...');
    startPythonServer();
  }, 3000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT received');
  server.close(() => process.exit(0));
});