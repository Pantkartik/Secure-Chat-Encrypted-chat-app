# 2-User Video Call Testing Guide

## Server Status ✅
- **Backend Server**: Running on port 3001
- **Frontend Server**: Running on port 3005

## Testing Setup Instructions

### Step 1: Create a Test Session (User 1)
1. Open your browser and go to: `http://localhost:3005`
2. Click on **"Host Session"** button
3. You should see a session ID (8-character code like "ABC12345")
4. Keep this page open - you'll need the session ID for User 2

### Step 2: Join the Session (User 2)
1. Open a **second browser window or tab** (or use a different browser)
2. Go to: `http://localhost:3005`
3. Click on **"Join Session"** button
4. Enter the session ID from User 1
5. Enter a different username (e.g., "User2")
6. Click "Join Session"

### Step 3: Verify Both Users Are Connected
1. Both users should now be in the same chat session
2. You should see both usernames in the chat interface
3. Try sending a text message to confirm connectivity

## Video Call Testing

### Test Video Call (User 1 initiates)
1. **User 1**: Click the **"Video Call"** button in the chat interface
2. **User 2**: Should see an incoming video call notification
3. **User 2**: Click **"Answer"** to accept the call
4. Verify:
   - Video streams appear in both windows
   - Audio works bidirectionally
   - Call duration displays correctly

### Test Audio Call (User 2 initiates)
1. **User 2**: Click the **"Audio Call"** button in the chat interface
2. **User 1**: Should see an incoming audio call notification
3. **User 1**: Click **"Answer"** to accept the call
4. Verify:
   - Audio-only interface appears (no video)
   - Audio works bidirectionally
   - Call controls show mute/unmute only

## Call Controls Testing

### During Any Active Call, Test:
1. **Mute/Unmute**: Click the microphone icon
2. **Video Toggle** (video calls only): Click the video camera icon
3. **End Call**: Click the red phone icon
4. **Call Duration**: Verify timer increments correctly

### Test Call Rejection
1. Initiate a call from one user
2. Other user clicks **"Decline"**
3. Verify call ends properly on both sides

## Expected Results ✅
- Calls connect within 2-3 seconds
- Video quality is clear and smooth
- Audio is clear with minimal latency
- Call controls respond immediately
- Both users can end calls independently
- Proper cleanup when calls end

## Troubleshooting

### If Calls Don't Connect:
1. Check browser permissions for camera/microphone
2. Verify both users are in the same session
3. Check browser console for WebRTC errors
4. Ensure stable internet connection

### If Video/Audio Quality Issues:
1. Check network bandwidth
2. Try refreshing the page
3. Verify camera/microphone hardware is working
4. Check for browser extensions blocking media

### Browser Permissions:
- **Chrome/Firefox**: Allow camera and microphone access
- **Safari**: May need to enable WebRTC in settings
- **Mobile**: Ensure camera/microphone permissions are granted

## Test Completion Checklist
- [ ] Both users can join the same session
- [ ] Text messaging works between users
- [ ] Video call connects successfully
- [ ] Audio call connects successfully
- [ ] Call controls work properly
- [ ] Call rejection works
- [ ] Call duration displays correctly
- [ ] Both users can end calls
- [ ] Media streams cleanup properly

## Ready to Test! 🚀
Both servers are running and the video calling feature is fully implemented. Follow the steps above to test with 2 users!