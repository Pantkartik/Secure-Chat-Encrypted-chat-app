# Multi-User Video Call Implementation Guide

This guide explains how to add multi-user video call functionality to your application using the updated `VideoCall` component.

## 🎯 Overview

The multi-user video call feature supports:
- **Individual calls**: One-on-one video/audio calls
- **Group calls**: Up to 4 participants in a video conference
- **Flexible UI**: Grid layout for group calls, picture-in-picture for individual calls
- **Proper cleanup**: Automatic resource management and stream cleanup

## 🚀 Key Features

### Multi-User Support
- **Grid Layout**: 2x2 grid for up to 4 participants
- **Dynamic Video Elements**: Automatically render video streams for each participant
- **User Identification**: Display usernames below each video stream
- **Empty Slots**: Visual placeholders for available participant slots

### Enhanced Media Management
- **Stream Cloning**: Proper stream handling to avoid conflicts
- **Resource Cleanup**: Automatic cleanup of all streams and peer connections
- **Error Handling**: Robust error handling for media access and WebRTC operations

## 📋 Implementation Steps

### 1. Component Props

The `VideoCall` component now accepts these props:

```typescript
interface VideoCallProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  username: string
  socket: any
  targetUserId?: string      // For individual calls
  isGroupCall?: boolean      // Enable multi-user mode
  isAudioOnly?: boolean      // Audio-only calls
}
```

### 2. Basic Usage

```tsx
import VideoCall from "@/components/video-call"

// Individual video call
<VideoCall
  isOpen={true}
  onClose={() => setIsOpen(false)}
  sessionId="user123"
  username="John Doe"
  socket={socket}
  targetUserId="user456"
  isGroupCall={false}
  isAudioOnly={false}
/>

// Group video call
<VideoCall
  isOpen={true}
  onClose={() => setIsOpen(false)}
  sessionId="room123"
  username="John Doe"
  socket={socket}
  isGroupCall={true}
  isAudioOnly={false}
/>
```

### 3. Example Implementation

Use the provided `MultiUserVideoExample` component:

```tsx
import MultiUserVideoExample from "@/components/multi-user-video-example"

function App() {
  const socket = useSocket() // Your socket implementation
  
  return (
    <MultiUserVideoExample
      sessionId="your-session-id"
      username="Your Username"
      socket={socket}
    />
  )
}
```

## 🔧 Key Functions

### `startMultiUserCall(participants: string[])`
Starts a group call with specified participants.

### `createPeerConnection(userId: string)`
Creates a peer connection for a specific user in multi-user mode.

### `renderRemoteVideos()`
Dynamically renders video elements for all remote participants.

## 🎨 UI Components

### Video Grid Layout
- **Local Video**: Top-left corner with username label
- **Remote Videos**: Other grid positions with user identification
- **Empty Slots**: Visual placeholders with user icons
- **Video Disabled States**: Shows video-off icons when video is disabled

### Call Controls
- **Audio Toggle**: Mute/unmute microphone
- **Video Toggle**: Enable/disable camera (video calls only)
- **End Call**: Properly terminate all connections
- **Minimize/Maximize**: Resize the call interface

## 🔒 Security Considerations

- **Media Permissions**: Request camera/microphone access appropriately
- **Stream Management**: Proper cleanup prevents memory leaks
- **User Privacy**: Clear visual indicators for video/audio states

## 🐛 Troubleshooting

### Common Issues

1. **Camera not opening for second user**
   - Ensure `initializeMedia()` is called in `answerCall()`
   - Check browser permissions for camera/microphone

2. **Video streams not displaying**
   - Verify stream cloning is working correctly
   - Check video element `srcObject` assignment

3. **Group calls not connecting**
   - Ensure all participants use the same session ID
   - Verify socket connections are established

### Debug Tips

- Use browser developer tools to inspect media streams
- Check console logs for WebRTC connection states
- Verify socket event emissions and receptions

## 📱 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (may require user interaction for autoplay)
- **Edge**: Full support

## 🚀 Performance Optimization

- **Stream Cloning**: Prevents direct stream manipulation conflicts
- **Resource Cleanup**: Automatic cleanup prevents memory leaks
- **Grid Layout**: Efficient DOM structure for multiple video elements

## 🔮 Future Enhancements

- **Screen Sharing**: Add screen sharing capabilities
- **Chat Integration**: Text chat during video calls
- **Recording**: Call recording functionality
- **Virtual Backgrounds**: Background blur/replacement
- **Mobile Optimization**: Better mobile device support

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the example implementation in `multi-user-video-example.tsx`
3. Examine the main component in `video-call.tsx`
4. Test with the provided example component

---

**Note**: This implementation uses a mesh topology where each participant connects directly to every other participant. For larger groups (5+ participants), consider implementing an SFU (Selective Forwarding Unit) server for better performance.