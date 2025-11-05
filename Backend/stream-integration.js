const { StreamVideoClient } = require('@stream-io/video-client');
const { StreamClient } = require('@stream-io/node-sdk');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create a function to get a fresh Stream Video client instance
function getStreamVideoClient() {
  return new StreamVideoClient({
    apiKey: process.env.STREAM_API_KEY,
    secret: process.env.STREAM_API_SECRET
  });
}

// Initialize server-side authentication
async function initializeStreamClient() {
  try {
    const streamClient = getStreamVideoClient();
    console.log('Stream client initialized with API key and secret');
    return streamClient;
  } catch (error) {
    console.error('Error initializing Stream client:', error);
    return null;
  }
}

/**
 * Generate Stream Video token for authenticated user
 * @param {string} userId - Unique user identifier
 * @param {string} userName - User display name
 * @returns {Object} - Token and user data
 */
async function generateStreamToken(userId, userName) {
  try {
    // Use Stream Node.js SDK for proper server-side token generation
    const streamClient = new StreamClient(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);
    
    // Generate token using Stream's official SDK
    const token = streamClient.createToken(userId, Math.floor(Date.now() / 1000) + (60 * 60));
    
    console.log('[DEBUG] Generated Stream Video token for user:', userId);
    console.log('[DEBUG] API Key:', process.env.STREAM_API_KEY);
    console.log('[DEBUG] Token length:', token.length);
    
    return {
      success: true,
      token: token,
      apiKey: process.env.STREAM_API_KEY,
      user: {
        id: userId,
        name: userName
      }
    };
  } catch (error) {
    console.error('[DEBUG] Error generating Stream Video token:', error);
    
    // Fallback to manual JWT generation if SDK method fails
    try {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        user_id: userId,
        iat: now,
        exp: now + (60 * 60)
      };
      
      const token = jwt.sign(payload, process.env.STREAM_API_SECRET, {
        algorithm: 'HS256',
        header: {
          typ: 'JWT',
          alg: 'HS256'
        }
      });
      
      console.log('[DEBUG] Fallback: Generated manual JWT token for user:', userId);
      
      return {
        success: true,
        token: token,
        apiKey: process.env.STREAM_API_KEY,
        user: {
          id: userId,
          name: userName
        }
      };
    } catch (fallbackError) {
      console.error('[DEBUG] Fallback token generation also failed:', fallbackError);
      return {
        success: false,
        error: 'Failed to generate token'
      };
    }
  }
}

/**
 * Create a new video call using Stream Video
 * @param {string} callId - Unique call identifier
 * @param {string} callName - Call display name
 * @param {string[]} memberIds - Array of user IDs to add to the call
 * @returns {Object} - Call data
 */
async function createVideoCallChannel(callId, callName, memberIds = []) {
  try {
    const streamClient = getStreamVideoClient();
    
    // Create call using Stream Video
    const call = streamClient.call('default', callId);
    await call.create({
      data: {
        created_by_id: memberIds[0] || 'system',
        members: memberIds.map(id => ({ user_id: id })),
        name: callName,
        custom: {
          type: 'video_call',
          created_at: new Date().toISOString()
        }
      }
    });

    return {
      success: true,
      call: {
        id: call.id,
        name: callName,
        type: 'default',
        members: memberIds
      }
    };
  } catch (error) {
    console.error('Error creating video call:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add members to existing call
 * @param {string} callId - Call identifier
 * @param {string[]} memberIds - Array of user IDs to add
 * @returns {Object} - Result of the operation
 */
async function addChannelMembers(callId, memberIds) {
  try {
    const streamClient = getStreamVideoClient();
    const call = streamClient.call('default', callId);
    
    // Add members to the call
    await call.addMembers(memberIds.map(id => ({ user_id: id })));

    return {
      success: true,
      message: 'Members added successfully'
    };
  } catch (error) {
    console.error('Error adding call members:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get call information
 * @param {string} callId - Call identifier
 * @returns {Object} - Call data
 */
async function getChannelInfo(callId) {
  try {
    const streamClient = getStreamVideoClient();
    const call = streamClient.call('default', callId);
    const callData = await call.get();

    return {
      success: true,
      call: {
        id: call.id,
        name: callData.name,
        type: callData.type,
        members: callData.members || [],
        created_at: callData.created_at
      }
    };
  } catch (error) {
    console.error('Error getting call info:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a call
 * @param {string} callId - Call identifier
 * @returns {Object} - Result of the operation
 */
async function deleteChannel(callId) {
  try {
    const streamClient = getStreamVideoClient();
    const call = streamClient.call('default', callId);
    await call.delete();

    return {
      success: true,
      message: 'Call deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting call:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateStreamToken,
  createVideoCallChannel,
  addChannelMembers,
  getChannelInfo,
  deleteChannel,
  getStreamVideoClient
};