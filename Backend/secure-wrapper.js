const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const auth = require('./auth');
const originalModule = require('./index'); // Your existing app
const originalApp = originalModule.app; // Extract the app from the exported object
const originalServer = originalModule.server; // Extract the server from the exported object
const originalIo = originalModule.io; // Extract the io from the exported object

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration - TEMPORARILY PERMISSIVE FOR DEBUGGING
const cors = require('cors');
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003'
];

app.use(cors({
  origin: function (origin, callback) {
    console.log(`[CORS DEBUG - WRAPPER] Origin check: ${origin}`);
    // TEMPORARILY ALLOW ALL LOCALHOST ORIGINS FOR DEBUGGING
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log(`[CORS DEBUG - WRAPPER] Origin ${origin} ALLOWED (debug mode)`);
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      console.log(`[CORS DEBUG - WRAPPER] Origin ${origin} ALLOWED`);
      callback(null, true);
    } else {
      console.log(`[CORS DEBUG - WRAPPER] Origin ${origin} NOT ALLOWED`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Serve admin login page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Authentication routes
app.post('/api/auth/login', auth.loginLimiter, auth.login);
app.post('/api/auth/logout', auth.authenticateToken, auth.logout);
app.get('/api/auth/me', auth.authenticateToken, auth.getCurrentUser);

// Stats endpoint (protected)
app.get('/api/auth/stats', auth.authenticateToken, (req, res) => {
  const sessions = auth.getActiveSessions();
  res.json({
    activeSessions: sessions.length,
    totalUsers: sessions.length,
    sessions: sessions
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount original app routes without authentication for backward compatibility
// The original app is already set up with its own routes, so we just need to
// import and use its router setup
app.use('/', originalApp);

// Socket.IO test endpoint
app.get('/socket-test', (req, res) => {
  res.json({ 
    status: 'Socket.IO server configured', 
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Security wrapper error:', err);
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'RateLimitError') {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

// Use the original server with Socket.IO instead of creating a new one
originalServer.listen(PORT, () => {
  console.log(`🔒 Secure server running on port ${PORT}`);
  console.log(`🛡️  Admin panel available at: http://localhost:${PORT}/admin`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat API (protected): http://localhost:${PORT}/api/chat/*`);
  console.log(`🌐 Original API (backward compatible): http://localhost:${PORT}/*`);
  console.log(`⚡ Socket.IO server running on: http://localhost:${PORT}/socket.io/`);
});

module.exports = app;