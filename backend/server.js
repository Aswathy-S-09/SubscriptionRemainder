const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const emailScheduler = require('./services/emailScheduler');

// Import routes
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const alertsRoutes = require('./routes/alerts');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // Replace with your frontend domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;

  // readyState values: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbConnected = dbStatus === 1;

  res.json({
    success: true,
    message: 'Subscribely API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbConnected,
      status: dbStatus === 0 ? 'disconnected' :
        dbStatus === 1 ? 'connected' :
          dbStatus === 2 ? 'connecting' : 'disconnecting'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Manual trigger for testing email scheduler
app.post('/api/test-scheduler', (req, res) => {
  emailScheduler.triggerManualCheck();
  res.json({
    success: true,
    message: 'Email scheduler test triggered. Check server logs for results.'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server with port fallback
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${port}/api/health`);

    // Start the email scheduler
    emailScheduler.startDailyScheduler();
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is busy, retrying on port ${parseInt(port) + 1}...`);
      server.close();
      startServer(parseInt(port) + 1);
    } else {
      console.error('Server error:', e);
    }
  });
}

startServer(PORT);

module.exports = app;
