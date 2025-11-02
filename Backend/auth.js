const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Store sessions in memory (consider using Redis in production)
const activeSessions = new Map();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

// Middleware to check JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  const token = req.cookies?.authToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid authentication' });
    }
    req.user = user;
    next();
  });
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
};

// Initialize admin user
const initializeAdmin = async () => {
  try {
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);
    return {
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: 'admin'
    };
  } catch (error) {
    console.error('Error initializing admin:', error);
    return null;
  }
};

// Login route
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await initializeAdmin();
    
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await verifyPassword(password, admin.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ username, role: 'admin' });
    
    // Store session
    const sessionId = Date.now().toString();
    activeSessions.set(sessionId, {
      username,
      role: 'admin',
      createdAt: new Date(),
      lastActivity: new Date()
    });

    // Set secure cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful',
      token,
      user: { username, role: 'admin' }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout route
const logout = (req, res) => {
  res.clearCookie('authToken');
  res.json({ message: 'Logout successful' });
};

// Get current user
const getCurrentUser = (req, res) => {
  res.json({ user: req.user });
};

// Get active sessions
const getActiveSessions = () => {
  return Array.from(activeSessions.entries()).map(([id, session]) => ({
    id,
    username: session.username,
    role: session.role,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity
  }));
};

// Clean up old sessions
const cleanupSessions = () => {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.lastActivity > maxAge) {
      activeSessions.delete(id);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

module.exports = {
  authenticateToken,
  requireAuth,
  loginLimiter,
  login,
  logout,
  getCurrentUser,
  getActiveSessions,
  initializeAdmin,
  hashPassword,
  verifyPassword,
  generateToken
};