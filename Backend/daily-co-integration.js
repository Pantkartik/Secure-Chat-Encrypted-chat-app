const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

// Daily.co API configuration
const DAILY_API_KEY = process.env.DAILY_API_KEY || 'your-daily-co-api-key';
const DAILY_API_URL = 'https://api.daily.co/v1';

// Create axios instance for Daily.co API
const dailyApi = axios.create({
  baseURL: DAILY_API_URL,
  headers: {
    'Authorization': `Bearer ${DAILY_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Create a new Daily.co room for video calling
 * @param {Object} roomConfig - Room configuration
 * @returns {Promise<Object>} Room data including URL
 */
async function createDailyRoom(roomConfig = {}) {
  try {
    const roomName = roomConfig.roomName || `room-${crypto.randomBytes(8).toString('hex')}`;
    
    const roomData = {
      name: roomName,
      privacy: roomConfig.privacy || 'public',
      properties: {
        max_participants: roomConfig.maxParticipants || 10,
        max_screenshare_duration_minutes: 60,
        enable_screenshare: true,
        enable_chat: true,
        enable_recording: roomConfig.enableRecording || 'cloud',
        enable_pip: true,
        enable_knocking: false,
        enable_prejoin_ui: false,
        enable_terse_logging: true,
        // Optimize for chat application
        start_video_off: false,
        start_audio_off: false,
        // Bandwidth optimization
        max_video_quality: '720p',
        // Mobile optimization
        enable_mobile_browser_native_ui: true,
        // Security settings
        owner_only_broadcast: false,
        enable_hand_raising: true,
        ...roomConfig.properties
      }
    };

    const response = await dailyApi.post('/rooms', roomData);
    return response.data;
  } catch (error) {
    console.error('Error creating Daily.co room:', error.response?.data || error.message);
    throw new Error('Failed to create video room');
  }
}

/**
 * Get room information
 * @param {string} roomName - Room name
 * @returns {Promise<Object>} Room data
 */
async function getDailyRoom(roomName) {
  try {
    const response = await dailyApi.get(`/rooms/${roomName}`);
    return response.data;
  } catch (error) {
    console.error('Error getting Daily.co room:', error.response?.data || error.message);
    throw new Error('Failed to get room information');
  }
}

/**
 * Delete a room
 * @param {string} roomName - Room name
 * @returns {Promise<Object>} Deletion result
 */
async function deleteDailyRoom(roomName) {
  try {
    const response = await dailyApi.delete(`/rooms/${roomName}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting Daily.co room:', error.response?.data || error.message);
    throw new Error('Failed to delete room');
  }
}

/**
 * Get meeting token for private rooms
 * @param {Object} tokenConfig - Token configuration
 * @returns {Promise<Object>} Token data
 */
async function createMeetingToken(tokenConfig = {}) {
  try {
    const tokenData = {
      properties: {
        room_name: tokenConfig.roomName,
        user_name: tokenConfig.userName,
        user_id: tokenConfig.userId,
        is_owner: tokenConfig.isOwner || false,
        // Token expiration (24 hours)
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        ...tokenConfig.properties
      }
    };

    const response = await dailyApi.post('/meeting-tokens', tokenData);
    return response.data;
  } catch (error) {
    console.error('Error creating meeting token:', error.response?.data || error.message);
    throw new Error('Failed to create meeting token');
  }
}

/**
 * Express middleware for Daily.co integration
 */
function createDailyCoMiddleware() {
  const router = express.Router();

  // Create a new room
  router.post('/create-daily-room', async (req, res) => {
    try {
      const { roomName, maxParticipants, privacy, properties } = req.body;
      
      const roomConfig = {
        roomName,
        maxParticipants: maxParticipants || 10,
        privacy: privacy || 'public',
        properties: properties || {}
      };

      const room = await createDailyRoom(roomConfig);
      
      res.json({
        success: true,
        room: {
          url: room.url,
          name: room.name,
          id: room.id,
          created_at: room.created_at,
          config: room.config
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get room information
  router.get('/daily-room/:roomName', async (req, res) => {
    try {
      const { roomName } = req.params;
      const room = await getDailyRoom(roomName);
      
      res.json({
        success: true,
        room
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Create meeting token for private rooms
  router.post('/create-meeting-token', async (req, res) => {
    try {
      const { roomName, userName, userId, isOwner, properties } = req.body;
      
      const tokenConfig = {
        roomName,
        userName,
        userId,
        isOwner: isOwner || false,
        properties: properties || {}
      };

      const token = await createMeetingToken(tokenConfig);
      
      res.json({
        success: true,
        token: token.token
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Delete room (cleanup)
  router.delete('/daily-room/:roomName', async (req, res) => {
    try {
      const { roomName } = req.params;
      await deleteDailyRoom(roomName);
      
      res.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

/**
 * Socket.IO event handlers for video calling
 */
function setupVideoCallSocketHandlers(io, socket) {
  // User starts a video call
  socket.on('video-call-started', (data) => {
    const { roomId, callerName, callerId, roomUrl } = data;
    
    // Broadcast to all users in the chat room except the caller
    socket.to(roomId).emit('video-call-notification', {
      type: 'call-started',
      callerName,
      callerId,
      roomUrl,
      timestamp: new Date().toISOString()
    });
  });

  // User ends a video call
  socket.on('video-call-ended', (data) => {
    const { roomId, callerId } = data;
    
    // Broadcast to all users in the chat room
    socket.to(roomId).emit('video-call-notification', {
      type: 'call-ended',
      callerId,
      timestamp: new Date().toISOString()
    });
  });

  // User joins an existing call
  socket.on('video-call-joined', (data) => {
    const { roomId, userName, userId } = data;
    
    // Notify other users in the call
    socket.to(roomId).emit('video-call-participant-joined', {
      userName,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // User leaves a call
  socket.on('video-call-left', (data) => {
    const { roomId, userName, userId } = data;
    
    // Notify other users in the call
    socket.to(roomId).emit('video-call-participant-left', {
      userName,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle call errors
  socket.on('video-call-error', (data) => {
    const { roomId, error, userId } = data;
    
    // Notify relevant users about the error
    socket.to(roomId).emit('video-call-notification', {
      type: 'call-error',
      error,
      userId,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Cleanup function to delete old rooms
 */
async function cleanupOldRooms() {
  try {
    const response = await dailyApi.get('/rooms');
    const rooms = response.data.data;
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    
    for (const room of rooms) {
      if (new Date(room.created_at) < oneHourAgo) {
        try {
          await deleteDailyRoom(room.name);
          console.log(`Deleted old room: ${room.name}`);
        } catch (error) {
          console.error(`Failed to delete room ${room.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error during room cleanup:', error);
  }
}

module.exports = {
  createDailyRoom,
  getDailyRoom,
  deleteDailyRoom,
  createMeetingToken,
  createDailyCoMiddleware,
  setupVideoCallSocketHandlers,
  cleanupOldRooms
};