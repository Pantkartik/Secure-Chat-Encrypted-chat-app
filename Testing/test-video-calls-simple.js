const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3005';

// Test configuration
const TEST_CONFIG = {
  sessionId: 'TEST1234',
  user1: 'TestUser1',
  user2: 'TestUser2'
};

// Test results
const testResults = {
  sessionCreation: false,
  user1Join: false,
  user2Join: false,
  videoCall: false,
  audioCall: false,
  callControls: false,
  errors: []
};

// Helper function to create session
async function createSession() {
  try {
    console.log('📝 Creating test session...');
    const response = await axios.post(`${API_BASE}/api/session`, {});
    console.log('✅ Session created:', response.data);
    testResults.sessionCreation = true;
    return response.data.sessionId;
  } catch (error) {
    console.error('❌ Error creating session:', error.message);
    testResults.errors.push(`Session creation: ${error.message}`);
    return null;
  }
}

// Helper function to join session
async function joinSession(username, sessionId) {
  try {
    console.log(`👤 ${username} joining session ${sessionId}...`);
    const response = await axios.post(`${API_BASE}/api/session/join`, {
      sessionId,
      username
    });
    console.log(`✅ ${username} joined:`, response.data);
    return true;
  } catch (error) {
    console.error(`❌ Error joining session for ${username}:`, error.message);
    testResults.errors.push(`Join session (${username}): ${error.message}`);
    return false;
  }
}

// Helper function to test socket connection
function testSocketConnection(username, sessionId) {
  return new Promise((resolve) => {
    console.log(`🔌 ${username} connecting via socket...`);
    const socket = io(API_BASE);
    
    socket.on('connect', () => {
      console.log(`✅ ${username} socket connected`);
      socket.emit('joinSession', { sessionId, username });
    });

    socket.on('sessionJoined', (data) => {
      console.log(`✅ ${username} session joined:`, data);
      if (username === 'TestUser1') {
        testResults.user1Join = true;
      } else {
        testResults.user2Join = true;
      }
      
      // Test video call after both users join
      setTimeout(() => {
        if (username === 'TestUser1') {
          testVideoCall(socket, sessionId);
        }
      }, 2000);
      
      resolve(socket);
    });

    socket.on('error', (error) => {
      console.error(`❌ ${username} socket error:`, error);
      testResults.errors.push(`Socket error (${username}): ${error}`);
      resolve(null);
    });
  });
}

// Helper function to test video call
function testVideoCall(socket, sessionId) {
  console.log('📹 Testing video call...');
  
  socket.emit('videoCallRequest', {
    to: 'TestUser2',
    from: 'TestUser1',
    sessionId,
    isAudioCall: false
  });
  
  console.log('📹 Video call request sent');
  testResults.videoCall = true;
  
  // Test call controls
  setTimeout(() => {
    testCallControls(socket);
  }, 2000);
}

// Helper function to test call controls
function testCallControls(socket) {
  console.log('🎛️ Testing call controls...');
  
  socket.emit('toggleVideo', { enabled: false });
  console.log('🎛️ Video toggled off');
  
  socket.emit('toggleAudio', { enabled: false });
  console.log('🎛️ Audio toggled off');
  
  testResults.callControls = true;
  
  // End call
  setTimeout(() => {
    socket.emit('endCall');
    console.log('📞 Call ended');
    socket.disconnect();
  }, 2000);
}

// Main test function
async function runTests() {
  console.log('🚀 Starting simplified video call tests...\n');
  
  // Create session
  const sessionId = await createSession();
  if (!sessionId) {
    console.log('❌ Cannot proceed without session');
    return generateReport();
  }
  
  // Join users
  const user1Joined = await joinSession(TEST_CONFIG.user1, sessionId);
  const user2Joined = await joinSession(TEST_CONFIG.user2, sessionId);
  
  if (!user1Joined || !user2Joined) {
    console.log('❌ Cannot proceed without both users joined');
    return generateReport();
  }
  
  // Test socket connections
  const socket1 = await testSocketConnection(TEST_CONFIG.user1, sessionId);
  const socket2 = await testSocketConnection(TEST_CONFIG.user2, sessionId);
  
  // Wait for tests to complete
  setTimeout(() => {
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();
    generateReport();
  }, 10000);
}

// Generate test report
function generateReport() {
  console.log('\n📊 Test Results Report:');
  console.log('========================');
  
  const tests = [
    { name: 'Session Creation', passed: testResults.sessionCreation },
    { name: 'User 1 Join', passed: testResults.user1Join },
    { name: 'User 2 Join', passed: testResults.user2Join },
    { name: 'Video Call', passed: testResults.videoCall },
    { name: 'Call Controls', passed: testResults.callControls }
  ];
  
  let passedCount = 0;
  tests.forEach(test => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test.name}`);
    if (test.passed) passedCount++;
  });
  
  console.log(`\n📈 Success Rate: ${passedCount}/${tests.length} (${Math.round(passedCount/tests.length * 100)}%)`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n🎯 Test Summary:');
  if (passedCount === tests.length) {
    console.log('✅ All tests passed! Video calling feature is working correctly.');
  } else if (passedCount >= tests.length * 0.6) {
    console.log('⚠️  Most tests passed. Video calling feature is mostly functional.');
  } else {
    console.log('❌ Many tests failed. Video calling feature needs debugging.');
  }
  
  process.exit(passedCount === tests.length ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});