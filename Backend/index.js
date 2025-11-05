const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const {
  generateStreamToken,
  createVideoCallChannel,
  addChannelMembers,
  getChannelInfo,
  deleteChannel
} = require('./stream-integration.js');

// Import Daily.co integration
const { createDailyCoMiddleware } = require('./daily-co-integration.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling']
});

/** Enable CORS for all routes */
// Updated CORS to allow local development and production
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003',
    'https://your-frontend-domain.com',
    'https://cypherchat-backend.loca.lt'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session persistence setup
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
let sessions = {};
let userSessions = {};

// Load sessions from file on startup
function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      sessions = parsed.sessions || {};
      userSessions = parsed.userSessions || {};
      console.log('[DEBUG] Loaded sessions from file:', Object.keys(sessions));
    }
  } catch (error) {
    console.error('[DEBUG] Error loading sessions:', error);
    sessions = {};
    userSessions = {};
  }
}

// Save sessions to file
function saveSessions() {
  try {
    const data = JSON.stringify({ sessions, userSessions }, null, 2);
    fs.writeFileSync(SESSIONS_FILE, data, 'utf8');
    console.log('[DEBUG] Saved sessions to file');
  } catch (error) {
    console.error('[DEBUG] Error saving sessions:', error);
  }
}

// Load sessions on startup
loadSessions();

// Save sessions periodically (every 30 seconds)
setInterval(saveSessions, 30000);

console.log('[DEBUG] Sessions initialized:', sessions);

// Create a new chat session
app.post('/api/session', (req, res) => {
  const sessionId = uuidv4().substring(0, 8).toUpperCase();
  console.log(`[DEBUG] Created new session: ${sessionId}`);
  sessions[sessionId] = { 
    id: sessionId, 
    createdAt: new Date().toISOString(),
    messages: [],
    users: []
  };
  saveSessions(); // Save immediately after creating
  res.json({ sessionId });
});

// Health check endpoint for Railway
app.post('/api/create-session', (req, res) => {
  console.log('[DEBUG] Health check - create-session endpoint hit');
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Join a session by token
app.post("/api/session/join", (req, res) => {
  const { sessionId, username } = req.body;
  console.log(`[DEBUG] Join request received for session ID: ${sessionId}`);
  console.log(`[DEBUG] Available sessions:`, Object.keys(sessions));
  
  if (!sessions[sessionId]) {
    console.log(`[DEBUG] Session ${sessionId} not found`);
    return res.status(404).json({ success: false, error: "Session not found" });
  }
  
  // Store user session info
  if (!userSessions[sessionId]) {
    userSessions[sessionId] = [];
  }
  userSessions[sessionId].push(username);
  saveSessions(); // Save after successful join
  
  console.log(`[DEBUG] User ${username} successfully joined session ${sessionId}`);
  res.json({ success: true });
});

// Get session users
app.get('/api/session/:sessionId/users', (req, res) => {
  const { sessionId } = req.params;
  if (!sessions[sessionId]) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ users: sessions[sessionId].users });
});

// Get all users (for frontend user management)
app.get('/api/users', (req, res) => {
  try {
    const allUsers = [];
    Object.values(sessions).forEach(session => {
      if (session.users && Array.isArray(session.users)) {
        session.users.forEach(user => {
          allUsers.push({
            id: user.id,
            name: user.name,
            status: user.status || 'online',
            sessionId: session.id
          });
        });
      }
    });
    res.json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stream Video API Endpoints

// Register Daily.co middleware
app.use('/api', createDailyCoMiddleware());

// Generate Stream token for authenticated user
app.post('/api/stream/token', async (req, res) => {
  try {
    const { userId, userName } = req.body;
    
    if (!userId || !userName) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId and userName are required' 
      });
    }

    const result = await generateStreamToken(userId, userName);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in /api/stream/token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Create a new video call channel
app.post('/api/stream/channel', async (req, res) => {
  try {
    const { channelId, channelName, memberIds } = req.body;
    
    if (!channelId || !channelName) {
      return res.status(400).json({ 
        success: false, 
        error: 'channelId and channelName are required' 
      });
    }

    const result = await createVideoCallChannel(channelId, channelName, memberIds || []);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in /api/stream/channel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Add members to existing channel
app.post('/api/stream/channel/:channelId/members', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { memberIds } = req.body;
    
    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'memberIds array is required' 
      });
    }

    const result = await addChannelMembers(channelId, memberIds);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in /api/stream/channel/:channelId/members:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get channel information
app.get('/api/stream/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const result = await getChannelInfo(channelId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in /api/stream/channel/:channelId:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Delete a channel
app.delete('/api/stream/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    
    const result = await deleteChannel(channelId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in /api/stream/channel/:channelId:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Socket.IO for realtime chat
io.on('connection', (socket) => {
  console.log('[DEBUG] Socket connected:', socket.id);
  
  socket.on('joinSession', ({ sessionId, username }) => {
    console.log('[DEBUG] Socket joinSession:', { sessionId, username });
    socket.join(sessionId);
    
    // Initialize session if it doesn't exist
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        messages: [],
        users: []
      };
    }
    
    // Initialize session users array if not exists
    if (!sessions[sessionId].users) {
      sessions[sessionId].users = [];
    }
    
    // Add user to session if not already present
    const userExists = sessions[sessionId].users.some(user => user.id === socket.id);
    if (!userExists) {
      const userData = { 
        id: socket.id, 
        name: username, 
        status: 'online',
        isTyping: false
      };
      sessions[sessionId].users.push(userData);
      
      // Emit userJoined event with full user data
      socket.to(sessionId).emit('userJoined', userData);
      
      // Emit updated user count to all users in the session
      io.to(sessionId).emit('userCountUpdate', sessions[sessionId].users.length);
      
      // Send current users list to the new user
      socket.emit('usersList', sessions[sessionId].users);
      
      console.log(`[DEBUG] User ${username} (${socket.id}) joined session ${sessionId}. Total users: ${sessions[sessionId].users.length}`);
    }
  });

  socket.on('sendMessage', ({ sessionId, username, message, messageData }) => {
    console.log('[DEBUG] Socket sendMessage:', { sessionId, username, message, messageData });
    if (sessions[sessionId]) {
      if (!sessions[sessionId].messages) {
        sessions[sessionId].messages = [];
      }
      // Use the messageData from frontend if provided, otherwise create new
      const finalMessageData = messageData || { 
        id: Date.now().toString(),
        userId: username,
        userName: username,
        content: Buffer.from(message).toString('base64'),
        timestamp: new Date().toISOString(),
        encrypted: true,
        status: 'sent'
      };
      sessions[sessionId].messages.push(finalMessageData);
      
      // Handle private messages
      if (finalMessageData.isPrivate && finalMessageData.targetUserId) {
        // Send private message only to sender and target user
        const targetUser = sessions[sessionId].users.find(u => u.name === finalMessageData.targetUserId);
        if (targetUser) {
          // Send to target user
          socket.to(targetUser.id).emit('receiveMessage', finalMessageData);
          // Send back to sender
          socket.emit('receiveMessage', finalMessageData);
          console.log(`[DEBUG] Private message sent from ${username} to ${finalMessageData.targetUserId}`);
        } else {
          // Target user not found, send error to sender
          socket.emit('privateMessageError', { 
            message: `User ${finalMessageData.targetUserId} not found`, 
            originalMessage: finalMessageData 
          });
        }
      } else {
        // Regular message - broadcast to all users in session
        io.to(sessionId).emit('receiveMessage', finalMessageData);
      }
    }
  });

  socket.on('typingStart', ({ sessionId, username }) => {
    console.log('[DEBUG] Socket typingStart:', { sessionId, username });
    if (sessions[sessionId] && sessions[sessionId].users) {
      const user = sessions[sessionId].users.find(u => u.name === username);
      if (user) {
        user.isTyping = true;
        socket.to(sessionId).emit('userTyping', { username, isTyping: true });
      }
    }
  });

  socket.on('typingStop', ({ sessionId, username }) => {
    console.log('[DEBUG] Socket typingStop:', { sessionId, username });
    if (sessions[sessionId] && sessions[sessionId].users) {
      const user = sessions[sessionId].users.find(u => u.name === username);
      if (user) {
        user.isTyping = false;
        socket.to(sessionId).emit('userTyping', { username, isTyping: false });
      }
    }
  });

  // Video calling events
  // Video calling events with enhanced error handling
  socket.on('videoCallOffer', ({ sessionId, targetUserId, offer, callerName }) => {
    try {
      console.log('[DEBUG] Video call offer from', callerName, 'to', targetUserId);
      if (!callerName) {
        console.error('[ERROR] Missing callerName in videoCallOffer');
        socket.emit('videoCallError', { error: 'Missing callerName' });
        return;
      }
      
      if (targetUserId) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting videoCallOffer to room:', roomName);
        socket.to(roomName).emit('videoCallOffer', {
          offer,
          callerId: socket.id,
          callerName,
          sessionId
        });
      } else {
        console.log('[DEBUG] Emitting videoCallOffer to session:', sessionId);
        socket.to(sessionId).emit('videoCallOffer', {
          offer,
          callerId: socket.id,
          callerName,
          sessionId
        });
      }
    } catch (error) {
      console.error('[ERROR] videoCallOffer error:', error);
      socket.emit('videoCallError', { error: error.message });
    }
  });

  socket.on('videoCallAnswer', ({ targetUserId, answer, callerName }) => {
    try {
      console.log('[DEBUG] Video call answer to', targetUserId);
      if (!callerName) {
        console.error('[ERROR] Missing callerName in videoCallAnswer');
        socket.emit('videoCallError', { error: 'Missing callerName' });
        return;
      }
      
      if (targetUserId && callerName) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting videoCallAnswer to room:', roomName);
        socket.to(roomName).emit('videoCallAnswer', {
          answer,
          answererId: socket.id
        });
      } else {
        console.log('[DEBUG] Emitting videoCallAnswer to targetUserId:', targetUserId);
        socket.to(targetUserId).emit('videoCallAnswer', {
          answer,
          answererId: socket.id
        });
      }
    } catch (error) {
      console.error('[ERROR] videoCallAnswer error:', error);
      socket.emit('videoCallError', { error: error.message });
    }
  });

  socket.on('iceCandidate', ({ targetUserId, candidate, callerName }) => {
    try {
      console.log('[DEBUG] ICE candidate to', targetUserId);
      if (!callerName) {
        console.error('[ERROR] Missing callerName in iceCandidate');
        socket.emit('videoCallError', { error: 'Missing callerName' });
        return;
      }
      
      if (callerName && targetUserId) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting iceCandidate to room:', roomName);
        socket.to(roomName).emit('iceCandidate', {
          candidate,
          senderId: socket.id
        });
      } else {
        console.log('[DEBUG] Emitting iceCandidate to targetUserId:', targetUserId);
        socket.to(targetUserId).emit('iceCandidate', {
          candidate,
          senderId: socket.id
        });
      }
    } catch (error) {
      console.error('[ERROR] iceCandidate error:', error);
      socket.emit('videoCallError', { error: error.message });
    }
  });

  socket.on('videoCallEnd', ({ targetUserId, sessionId, callerName }) => {
    try {
      console.log('[DEBUG] Video call ended');
      if (targetUserId && callerName) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting videoCallEnd to room:', roomName);
        socket.to(roomName).emit('videoCallEnd', { callerId: socket.id });
      } else if (targetUserId) {
        console.log('[DEBUG] Emitting videoCallEnd to targetUserId:', targetUserId);
        socket.to(targetUserId).emit('videoCallEnd', { callerId: socket.id });
      } else if (sessionId) {
        console.log('[DEBUG] Emitting videoCallEnd to session:', sessionId);
        socket.to(sessionId).emit('videoCallEnd', { callerId: socket.id });
      }
    } catch (error) {
      console.error('[ERROR] videoCallEnd error:', error);
      socket.emit('videoCallError', { error: error.message });
    }
  });

  socket.on('videoCallRequest', ({ sessionId, targetUserId, callerName }) => {
    try {
      console.log('[DEBUG] Video call request from', callerName, 'to', targetUserId || 'all users');
      if (!callerName) {
        console.error('[ERROR] Missing callerName in videoCallRequest');
        socket.emit('videoCallError', { error: 'Missing callerName' });
        return;
      }
      
      if (targetUserId) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting videoCallRequest to room:', roomName);
        socket.to(roomName).emit('videoCallRequest', {
          callerId: socket.id,
          callerName,
          sessionId,
          fromUser: callerName,
          fromUserId: callerName
        });
      } else {
        console.log('[DEBUG] Emitting videoCallRequest to session:', sessionId);
        socket.to(sessionId).emit('videoCallRequest', {
          callerId: socket.id,
          callerName,
          sessionId,
          fromUser: callerName,
          fromUserId: callerName
        });
      }
    } catch (error) {
      console.error('[ERROR] videoCallRequest error:', error);
      socket.emit('videoCallError', { error: error.message });
    }
  });

  // Audio calling events with enhanced error handling
  socket.on('audioCallOffer', ({ sessionId, targetUserId, offer, callerName }) => {
    try {
      console.log('[DEBUG] Audio call offer from', callerName, 'to', targetUserId);
      if (!callerName) {
        console.error('[ERROR] Missing callerName in audioCallOffer');
        socket.emit('audioCallError', { error: 'Missing callerName' });
        return;
      }
      
      if (targetUserId) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting audioCallOffer to room:', roomName);
        socket.to(roomName).emit('audioCallOffer', {
          offer,
          callerId: socket.id,
          callerName,
          sessionId
        });
      } else {
        console.log('[DEBUG] Emitting audioCallOffer to session:', sessionId);
        socket.to(sessionId).emit('audioCallOffer', {
          offer,
          callerId: socket.id,
          callerName,
          sessionId
        });
      }
    } catch (error) {
      console.error('[ERROR] audioCallOffer error:', error);
      socket.emit('audioCallError', { error: error.message });
    }
  });

  socket.on('audioCallAnswer', ({ targetUserId, answer, callerName }) => {
    try {
      console.log('[DEBUG] Audio call answer to', targetUserId);
      if (!callerName) {
        console.error('[ERROR] Missing callerName in audioCallAnswer');
        socket.emit('audioCallError', { error: 'Missing callerName' });
        return;
      }
      
      if (targetUserId && callerName) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting audioCallAnswer to room:', roomName);
        socket.to(roomName).emit('audioCallAnswer', {
          answer,
          answererId: socket.id
        });
      } else {
        console.log('[DEBUG] Emitting audioCallAnswer to targetUserId:', targetUserId);
        socket.to(targetUserId).emit('audioCallAnswer', {
          answer,
          answererId: socket.id
        });
      }
    } catch (error) {
      console.error('[ERROR] audioCallAnswer error:', error);
      socket.emit('audioCallError', { error: error.message });
    }
  });

  socket.on('audioCallEnd', ({ targetUserId, sessionId, callerName }) => {
    try {
      console.log('[DEBUG] Audio call ended');
      if (targetUserId && callerName) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting audioCallEnd to room:', roomName);
        socket.to(roomName).emit('audioCallEnd', { callerId: socket.id });
      } else if (targetUserId) {
        console.log('[DEBUG] Emitting audioCallEnd to targetUserId:', targetUserId);
        socket.to(targetUserId).emit('audioCallEnd', { callerId: socket.id });
      } else if (sessionId) {
        console.log('[DEBUG] Emitting audioCallEnd to session:', sessionId);
        socket.to(sessionId).emit('audioCallEnd', { callerId: socket.id });
      }
    } catch (error) {
      console.error('[ERROR] audioCallEnd error:', error);
      socket.emit('audioCallError', { error: error.message });
    }
  });

  socket.on('audioCallRequest', ({ sessionId, targetUserId, callerName }) => {
    try {
      console.log('[DEBUG] Audio call request from', callerName, 'to', targetUserId || 'all users');
      if (!callerName) {
        console.error('[ERROR] Missing callerName in audioCallRequest');
        socket.emit('audioCallError', { error: 'Missing callerName' });
        return;
      }
      
      if (targetUserId) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting audioCallRequest to room:', roomName);
        socket.to(roomName).emit('audioCallRequest', {
          callerId: socket.id,
          callerName,
          sessionId,
          fromUser: callerName,
          fromUserId: callerName
        });
      } else {
        console.log('[DEBUG] Emitting audioCallRequest to session:', sessionId);
        socket.to(sessionId).emit('audioCallRequest', {
          callerId: socket.id,
          callerName,
          sessionId,
          fromUser: callerName,
          fromUserId: callerName
        });
      }
    } catch (error) {
      console.error('[ERROR] audioCallRequest error:', error);
      socket.emit('audioCallError', { error: error.message });
    }
  });

  // Simple Peer signaling handlers
  socket.on('simplePeerSignal', ({ targetUserId, callerName, signal }) => {
    try {
      console.log('[DEBUG] Simple Peer signal from', callerName, 'to', targetUserId);
      if (!callerName) {
        console.error('[ERROR] Missing callerName in simplePeerSignal');
        socket.emit('simplePeerError', { error: 'Missing callerName' });
        return;
      }
      
      if (targetUserId) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Forwarding Simple Peer signal to room:', roomName);
        socket.to(roomName).emit('simplePeerSignal', {
          callerId: socket.id,
          callerName,
          signal,
          fromUser: callerName,
          fromUserId: callerName
        });
      } else {
        console.log('[DEBUG] Forwarding Simple Peer signal to user:', targetUserId);
        socket.to(targetUserId).emit('simplePeerSignal', {
          callerId: socket.id,
          callerName,
          signal,
          fromUser: callerName,
          fromUserId: callerName
        });
      }
    } catch (error) {
      console.error('[ERROR] simplePeerSignal error:', error);
      socket.emit('simplePeerError', { error: error.message });
    }
  });

  socket.on('simplePeerRequest', ({ sessionId, targetUserId, callerName, isVideoCall }) => {
    try {
      console.log('[DEBUG] Simple Peer request from', callerName, 'to', targetUserId || 'all users', 'video:', isVideoCall);
      if (!callerName) {
        console.error('[ERROR] Missing callerName in simplePeerRequest');
        socket.emit('simplePeerError', { error: 'Missing callerName' });
        return;
      }
      
      if (targetUserId) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting simplePeerRequest to room:', roomName);
        socket.to(roomName).emit('simplePeerRequest', {
          callerId: socket.id,
          callerName,
          sessionId,
          isVideoCall,
          fromUser: callerName,
          fromUserId: callerName
        });
      } else {
        console.log('[DEBUG] Emitting simplePeerRequest to session:', sessionId);
        socket.to(sessionId).emit('simplePeerRequest', {
          callerId: socket.id,
          callerName,
          sessionId,
          isVideoCall,
          fromUser: callerName,
          fromUserId: callerName
        });
      }
    } catch (error) {
      console.error('[ERROR] simplePeerRequest error:', error);
      socket.emit('simplePeerError', { error: error.message });
    }
  });

  socket.on('simplePeerEnd', ({ sessionId, targetUserId, callerName }) => {
    try {
      console.log('[DEBUG] Simple Peer end from', callerName, 'to', targetUserId || 'session', sessionId);
      if (!callerName) {
        console.error('[ERROR] Missing callerName in simplePeerEnd');
        socket.emit('simplePeerError', { error: 'Missing callerName' });
        return;
      }
      
      if (targetUserId) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        console.log('[DEBUG] Emitting simplePeerEnd to room:', roomName);
        socket.to(roomName).emit('simplePeerEnd', {
          callerId: socket.id,
          callerName,
          sessionId,
          fromUser: callerName,
          fromUserId: callerName
        });
      } else {
        console.log('[DEBUG] Emitting simplePeerEnd to session:', sessionId);
        socket.to(sessionId).emit('simplePeerEnd', {
          callerId: socket.id,
          callerName,
          sessionId,
          fromUser: callerName,
          fromUserId: callerName
        });
      }
    } catch (error) {
      console.error('[ERROR] simplePeerEnd error:', error);
      socket.emit('simplePeerError', { error: error.message });
    }
  });

  // Private chat events
  socket.on('joinPrivateChat', ({ userId, targetUserId }) => {
    console.log('[DEBUG] Private chat join:', { userId, targetUserId });
    // Create a private room for these two users
    const roomName = [userId, targetUserId].sort().join('-');
    socket.join(roomName);
    console.log(`[DEBUG] User ${userId} joined private room ${roomName}`);
  });

  socket.on('sendPrivateMessage', ({ senderId, receiverId, message }) => {
    console.log('[DEBUG] Private message from', senderId, 'to', receiverId);
    const roomName = [senderId, receiverId].sort().join('-');
    // Store private message in session (for persistence)
    // Note: In a production app, you'd want separate storage for private messages
    socket.to(roomName).emit('privateMessage', message);
    socket.emit('privateMessage', message); // Send back to sender
  });

  socket.on('typingStartPrivate', ({ userId, targetUserId }) => {
    console.log('[DEBUG] Private typing start from', userId, 'to', targetUserId);
    const roomName = [userId, targetUserId].sort().join('-');
    socket.to(roomName).emit('userTyping', { username: userId, isTyping: true });
  });

  socket.on('typingStopPrivate', ({ userId, targetUserId }) => {
    console.log('[DEBUG] Private typing stop from', userId, 'to', targetUserId);
    const roomName = [userId, targetUserId].sort().join('-');
    socket.to(roomName).emit('userTyping', { username: userId, isTyping: false });
  });
  
  socket.on('disconnect', () => {
    console.log('[DEBUG] User disconnected:', socket.id);
    
    // Notify about call disconnection
    socket.broadcast.emit('userDisconnected', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
    
    // Remove user from all sessions
    for (const sessionId in sessions) {
      const session = sessions[sessionId];
      if (session && session.users) {
        session.users = session.users.filter(user => user.id !== socket.id);
        
        // Notify other users in the session
        io.to(sessionId).emit('userLeft', {
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
        
        // Save session to file
        saveSessions();
      }
    }
    
    console.log('[DEBUG] User removed from sessions:', socket.id);
  });

  // Stream management events
  socket.on('streamStateChanged', ({ sessionId, targetUserId, callerName, isVideoEnabled, isAudioEnabled }) => {
    try {
      console.log('[DEBUG] Stream state changed - Video:', isVideoEnabled, 'Audio:', isAudioEnabled);
      if (targetUserId && callerName) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        socket.to(roomName).emit('streamStateChanged', {
          userId: socket.id,
          isVideoEnabled,
          isAudioEnabled,
          callerName
        });
      } else {
        socket.to(sessionId).emit('streamStateChanged', {
          userId: socket.id,
          isVideoEnabled,
          isAudioEnabled,
          callerName
        });
      }
    } catch (error) {
      console.error('[ERROR] streamStateChanged error:', error);
      socket.emit('videoCallError', { error: error.message });
    }
  });

  // Connection recovery events
  socket.on('requestCallState', ({ targetUserId, callerName }) => {
    try {
      console.log('[DEBUG] Requesting call state from', callerName);
      if (targetUserId && callerName) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        socket.to(roomName).emit('callStateRequest', {
          requesterId: socket.id,
          requesterName: callerName
        });
      } else {
        socket.to(targetUserId).emit('callStateRequest', {
          requesterId: socket.id,
          requesterName: callerName
        });
      }
    } catch (error) {
      console.error('[ERROR] requestCallState error:', error);
      socket.emit('videoCallError', { error: error.message });
    }
  });

  socket.on('callStateResponse', ({ targetUserId, callerName, isInCall, callType, participants }) => {
    try {
      console.log('[DEBUG] Sending call state response');
      if (targetUserId && callerName) {
        // For private chat, use the private room
        const roomName = [callerName, targetUserId].sort().join('-');
        socket.to(roomName).emit('callStateResponse', {
          isInCall,
          callType,
          participants,
          responderId: socket.id
        });
      } else {
        socket.to(targetUserId).emit('callStateResponse', {
          isInCall,
          callType,
          participants,
          responderId: socket.id
        });
      }
    } catch (error) {
      console.error('[ERROR] callStateResponse error:', error);
      socket.emit('videoCallError', { error: error.message });
    }
  });
});

// Start the server only if this file is run directly (not imported)
if (require.main === module) {
  const port = process.env.PORT || 3001;
  server.listen(port, () => {
    console.log(`Backend server is running on port ${port}`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[DEBUG] Saving sessions before shutdown...');
  saveSessions();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[DEBUG] Saving sessions before shutdown...');
  saveSessions();
  process.exit(0);
});

// Export for Railway deployment
module.exports = { app, server, io };