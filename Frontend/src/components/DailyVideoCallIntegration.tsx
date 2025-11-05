import React, { useState, useCallback } from 'react';
import DailyVideoCall from './DailyVideoCall';
import './DailyVideoCallIntegration.css';

interface DailyVideoCallIntegrationProps {
  chatRoomId: string;
  userName: string;
  userId: string;
  socket?: any;
}

const DailyVideoCallIntegration: React.FC<DailyVideoCallIntegrationProps> = ({
  chatRoomId,
  userName,
  userId,
  socket
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string>('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [callError, setCallError] = useState<string>('');

  // Create a Daily.co room via your backend
  const createRoom = useCallback(async () => {
    try {
      setIsCreatingRoom(true);
      setCallError('');

      // Call your backend to create a Daily.co room
      const response = await fetch('/api/create-daily-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: `chat-${chatRoomId}`,
          maxParticipants: 10,
          privacy: 'public', // or 'private' if you want to restrict access
          properties: {
            max_screenshare_duration_minutes: 60,
            enable_screenshare: true,
            enable_chat: true,
            enable_recording: 'cloud',
            enable_pip: true,
            enable_knocking: false,
            enable_prejoin_ui: false,
            enable_terse_logging: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      return data.room.url; // Daily.co room URL
    } catch (error) {
      console.error('Error creating Daily.co room:', error);
      setCallError('Failed to create video room. Please try again.');
      throw error;
    } finally {
      setIsCreatingRoom(false);
    }
  }, [chatRoomId]);

  // Start a video call
  const startVideoCall = useCallback(async () => {
    try {
      setCallError('');
      
      // Create room and get URL
      const roomUrl = await createRoom();
      setRoomUrl(roomUrl);
      setIsCallActive(true);
      setIsCallMinimized(false);

      // Notify other users in the chat room
      if (socket) {
        socket.emit('video-call-started', {
          roomId: chatRoomId,
          callerName: userName,
          callerId: userId,
          roomUrl: roomUrl
        });
      }

    } catch (error) {
      console.error('Error starting video call:', error);
      setCallError('Failed to start video call');
    }
  }, [createRoom, socket, chatRoomId, userName, userId]);

  // Join existing video call
  const joinVideoCall = useCallback((roomUrl: string) => {
    try {
      setRoomUrl(roomUrl);
      setIsCallActive(true);
      setIsCallMinimized(false);
      setCallError('');
    } catch (error) {
      console.error('Error joining video call:', error);
      setCallError('Failed to join video call');
    }
  }, []);

  // End video call
  const endVideoCall = useCallback(() => {
    setIsCallActive(false);
    setRoomUrl('');
    setIsCallMinimized(false);
    setCallError('');

    // Notify other users
    if (socket) {
      socket.emit('video-call-ended', {
        roomId: chatRoomId,
        callerId: userId
      });
    }
  }, [socket, chatRoomId, userId]);

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsCallMinimized(prev => !prev);
  }, []);

  return (
    <div className="daily-video-call-integration">
      {/* Video Call Button */}
      {!isCallActive && (
        <div className="video-call-controls-main">
          <button
            onClick={startVideoCall}
            disabled={isCreatingRoom}
            className="start-video-call-button"
            title="Start video call"
          >
            {isCreatingRoom ? (
              <>
                <span className="spinner-small"></span>
                Creating Room...
              </>
            ) : (
              <>
                📹 Start Video Call
              </>
            )}
          </button>
          
          {callError && (
            <div className="error-message">
              {callError}
            </div>
          )}
        </div>
      )}

      {/* Active Video Call */}
      {isCallActive && roomUrl && (
        <DailyVideoCall
          roomUrl={roomUrl}
          userName={userName}
          onCallEnd={endVideoCall}
          isMinimized={isCallMinimized}
          onToggleMinimize={toggleMinimize}
        />
      )}
    </div>
  );
};

export default DailyVideoCallIntegration;