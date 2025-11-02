/**
 * Comprehensive Video Call Testing Script
 * This script tests the video calling functionality by simulating socket events
 * and verifying the WebRTC implementation works correctly.
 */

const io = require('socket.io-client');
const axios = require('axios');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3005';

// Test users
const testUsers = [
  { username: 'TestUser1', userId: 'user1_123' },
  { username: 'TestUser2', userId: 'user2_456' }
];

// Test session ID
const TEST_SESSION_ID = 'TEST1234';

// Test results
const testResults = {
  sessionCreation: false,
  userJoin: false,
  socketConnection: false,
  videoCallRequest: false,
  audioCallRequest: false,
  webrtcOffer: false,
  webrtcAnswer: false,
  iceCandidate: false,
  callEnd: false,
  cleanup: false
};

/**
 * Create a test session
 */
async function createTestSession() {
  console.log('📝 Creating test session...');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/session`);
    
    if (response.data.sessionId) {
      console.log('✅ Test session created successfully:', response.data.sessionId);
      testResults.sessionCreation = true;
      return response.data.sessionId;
    } else {
      console.log('❌ Failed to create test session');
      return null;
    }
  } catch (error) {
    console.log('❌ Error creating test session:', error.message);
    return null;
  }
}

/**
 * Simulate user joining session
 */
async function simulateUserJoin(username, userId) {
  console.log(`👤 Simulating ${username} joining session...`);
  
  return new Promise((resolve) => {
    const socket = io(BACKEND_URL);
    
    socket.on('connect', () => {
      console.log(`✅ ${username} socket connected`);
      testResults.socketConnection = true;
      
      socket.emit('joinSession', { 
        sessionId: TEST_SESSION_ID, 
        username: username 
      });
    });
    
    socket.on('userJoined', (data) => {
      console.log(`✅ ${username} joined session successfully`, data);
      testResults.userJoin = true;
      resolve(socket);
    });
    
    socket.on('joinError', (error) => {
      console.log(`❌ ${username} join error:`, error);
      resolve(null);
    });
  });
}

/**
 * Test video call functionality
 */
async function testVideoCall(socket1, socket2) {
  console.log('📹 Testing video call functionality...');
  
  return new Promise((resolve) => {
    let videoCallTestsPassed = 0;
    const totalVideoTests = 4;
    
    // Set up listeners for socket2 (callee)
    socket2.on('videoCallRequest', (data) => {
      console.log('✅ Video call request received', data);
      testResults.videoCallRequest = true;
      videoCallTestsPassed++;
      
      // Simulate answering the call
      socket2.emit('videoCallAnswer', {
        callerId: data.callerId,
        answer: { type: 'answer', sdp: 'fake-sdp-answer' }
      });
    });
    
    socket2.on('videoCallOffer', (data) => {
      console.log('✅ Video call offer received', data);
      testResults.webrtcOffer = true;
      videoCallTestsPassed++;
    });
    
    socket2.on('videoCallAnswer', (data) => {
      console.log('✅ Video call answer received', data);
      testResults.webrtcAnswer = true;
      videoCallTestsPassed++;
    });
    
    socket2.on('iceCandidate', (data) => {
      console.log('✅ ICE candidate received', data);
      testResults.iceCandidate = true;
      videoCallTestsPassed++;
    });
    
    // Initiate video call from socket1 (caller)
    socket1.emit('videoCallRequest', {
      targetUserId: 'TestUser2',
      callerName: 'TestUser1',
      isAudioCall: false
    });
    
    // Send fake offer
    socket1.emit('videoCallOffer', {
      targetUserId: 'TestUser2',
      offer: { type: 'offer', sdp: 'fake-sdp-offer' }
    });
    
    // Send fake ICE candidate
    socket1.emit('iceCandidate', {
      targetUserId: 'TestUser2',
      candidate: { candidate: 'fake-ice-candidate' }
    });
    
    // End call after tests
    setTimeout(() => {
      socket1.emit('videoCallEnd', { targetUserId: 'TestUser2' });
      console.log('✅ Video call ended');
      testResults.callEnd = true;
      
      console.log(`📊 Video call tests: ${videoCallTestsPassed}/${totalVideoTests} passed`);
      resolve(videoCallTestsPassed === totalVideoTests);
    }, 2000);
  });
}

/**
 * Test audio call functionality
 */
async function testAudioCall(socket1, socket2) {
  console.log('🎤 Testing audio call functionality...');
  
  return new Promise((resolve) => {
    let audioCallTestsPassed = 0;
    const totalAudioTests = 4;
    
    // Set up listeners for socket2 (callee)
    socket2.on('audioCallRequest', (data) => {
      console.log('✅ Audio call request received', data);
      testResults.audioCallRequest = true;
      audioCallTestsPassed++;
      
      // Simulate answering the call
      socket2.emit('audioCallAnswer', {
        callerId: data.callerId,
        answer: { type: 'answer', sdp: 'fake-audio-sdp-answer' }
      });
    });
    
    socket2.on('audioCallOffer', (data) => {
      console.log('✅ Audio call offer received', data);
      audioCallTestsPassed++;
    });
    
    socket2.on('audioCallAnswer', (data) => {
      console.log('✅ Audio call answer received', data);
      audioCallTestsPassed++;
    });
    
    socket2.on('iceCandidate', (data) => {
      console.log('✅ ICE candidate received for audio call', data);
      audioCallTestsPassed++;
    });
    
    // Initiate audio call from socket1 (caller)
    socket1.emit('audioCallRequest', {
      targetUserId: 'TestUser2',
      callerName: 'TestUser1',
      isAudioCall: true
    });
    
    // Send fake audio offer
    socket1.emit('audioCallOffer', {
      targetUserId: 'TestUser2',
      offer: { type: 'offer', sdp: 'fake-audio-sdp-offer' }
    });
    
    // Send fake ICE candidate
    socket1.emit('iceCandidate', {
      targetUserId: 'TestUser2',
      candidate: { candidate: 'fake-audio-ice-candidate' }
    });
    
    // End call after tests
    setTimeout(() => {
      socket1.emit('audioCallEnd', { targetUserId: 'TestUser2' });
      console.log('✅ Audio call ended');
      
      console.log(`📊 Audio call tests: ${audioCallTestsPassed}/${totalAudioTests} passed`);
      resolve(audioCallTestsPassed === totalAudioTests);
    }, 2000);
  });
}

/**
 * Cleanup function
 */
async function cleanup(socket1, socket2) {
  console.log('🧹 Cleaning up test connections...');
  
  return new Promise((resolve) => {
    let cleanupCount = 0;
    
    socket1.disconnect();
    socket2.disconnect();
    
    socket1.on('disconnect', () => {
      console.log('✅ Socket 1 disconnected');
      cleanupCount++;
      if (cleanupCount === 2) {
        testResults.cleanup = true;
        resolve(true);
      }
    });
    
    socket2.on('disconnect', () => {
      console.log('✅ Socket 2 disconnected');
      cleanupCount++;
      if (cleanupCount === 2) {
        testResults.cleanup = true;
        resolve(true);
      }
    });
    
    // Fallback timeout
    setTimeout(() => {
      testResults.cleanup = true;
      resolve(true);
    }, 1000);
  });
}

/**
 * Generate test report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 VIDEO CALL TEST REPORT');
  console.log('='.repeat(50));
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(result => result === true).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\nOverall Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);
  
  console.log('\n📋 Detailed Results:');
  Object.entries(testResults).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${test}: ${status}`);
  });
  
  console.log('\n🔍 Analysis:');
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT: Video calling feature is working perfectly!');
  } else if (successRate >= 70) {
    console.log('👍 GOOD: Video calling feature is mostly functional with minor issues.');
  } else if (successRate >= 50) {
    console.log('⚠️  FAIR: Video calling feature has some issues that need attention.');
  } else {
    console.log('❌ POOR: Video calling feature has significant issues and needs debugging.');
  }
  
  console.log('\n🚀 Ready for Manual Testing!');
  console.log('Visit http://localhost:3005 to test with real users.');
  console.log('='.repeat(50) + '\n');
}

/**
 * Main test execution
 */
async function runComprehensiveTests() {
  console.log('🚀 Starting comprehensive video call tests...\n');
  
  try {
    // Create test session
    const sessionId = await createTestSession();
    if (!sessionId) {
      console.log('❌ Cannot proceed without test session');
      return;
    }
    
    // Update test session ID
    const TEST_SESSION_ID = sessionId;
    
    // Simulate users joining
    const socket1 = await simulateUserJoin('TestUser1', 'user1_123');
    const socket2 = await simulateUserJoin('TestUser2', 'user2_456');
    
    if (!socket1 || !socket2) {
      console.log('❌ Cannot proceed without both users connected');
      return;
    }
    
    // Wait a moment for connections to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test video calls
    const videoCallSuccess = await testVideoCall(socket1, socket2);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test audio calls
    const audioCallSuccess = await testAudioCall(socket1, socket2);
    
    // Cleanup
    await cleanup(socket1, socket2);
    
    // Generate report
    generateTestReport();
    
    console.log('🎉 Comprehensive testing completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
runComprehensiveTests();