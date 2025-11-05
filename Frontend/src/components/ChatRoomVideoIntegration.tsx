import React, { useState, useCallback, useEffect } from 'react';
import DailyVideoCallIntegration from './DailyVideoCallIntegration';
import './ChatRoomVideoIntegration.css';

interface ChatRoomVideoIntegrationProps {
  chatRoomId: string;
  userName: string;
  userId: string;
  socket: any;
  onVideoCallStart?: () => void;
  onVideoCallEnd?: () => void;
}

const ChatRoomVideoIntegration: React.FC<ChatRoomVideoIntegrationProps> = ({
  chatRoomId,
  userName,
  userId,
  socket,
  onVideoCallStart,
  onVideoCallEnd
}) => {
  const [incomingCall, setIncomingCall] = useState<{
    callerName: string;
    callerId: string;
    roomUrl: string;
  } | null>(null);
  const [callNotification, setCallNotification] = useState<string>('');
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for video call notifications
    const handleVideoCallNotification = (data: any) => {
      switch (data.type) {
        case 'call-started':
          if (data.callerId !== userId) {
            setIncomingCall({
              callerName: data.callerName,
              callerId: data.callerId,
              roomUrl: data.roomUrl
            });
            setCallNotification(`${data.callerName} started a video call`);
            
            // Auto-hide notification after 10 seconds
            setTimeout(() => {
              setCallNotification('');
              if (!isInCall) {
                setIncomingCall(null);
              }
            }, 10000);
          }
          break;
          
        case 'call-ended':
          setCallNotification('Video call ended');
          setIncomingCall(null);
          setIsInCall(false);
          onVideoCallEnd?.();
          
          // Hide notification after 3 seconds
          setTimeout(() => setCallNotification(''), 3000);
          break;
          
        case 'call-error':
          setCallNotification(`Video call error: ${data.error}`);
          setTimeout(() => setCallNotification(''), 5000);
          break;
      }
    };

    socket.on('video-call-notification', handleVideoCallNotification);

    return () => {
      socket.off('video-call-notification', handleVideoCallNotification);
    };
  }, [socket, userId, isInCall, onVideoCallEnd]);

  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      setIsInCall(true);
      setIncomingCall(null);
      setCallNotification('');
      onVideoCallStart?.();
    }
  }, [incomingCall, onVideoCallStart]);

  const handleRejectCall = useCallback(() => {
    setIncomingCall(null);
    setCallNotification('');
  }, []);

  const handleCallStarted = useCallback(() => {
    setIsInCall(true);
    onVideoCallStart?.();
  }, [onVideoCallStart]);

  const handleCallEnded = useCallback(() => {
    setIsInCall(false);
    setIncomingCall(null);
    onVideoCallEnd?.();
  }, [onVideoCallEnd]);

  // Use effect to trigger callbacks when call state changes
  useEffect(() => {
    if (isInCall) {
      handleCallStarted();
    } else {
      handleCallEnded();
    }
  }, [isInCall, handleCallStarted, handleCallEnded]);

  return (
    <div className="chat-room-video-integration">
      {/* Call Notification */}
      {callNotification && (
        <div className="call-notification">
          <div className="notification-content">
            <span className="notification-text">{callNotification}</span>
            {incomingCall && (
              <div className="call-actions">
                <button
                  onClick={handleAcceptCall}
                  className="accept-button"
                  title="Accept call"
                >
                  ✅ Accept
                </button>
                <button
                  onClick={handleRejectCall}
                  className="reject-button"
                  title="Reject call"
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Call Button */}
      {!isInCall && (
        <div className="video-call-button-container">
          <DailyVideoCallIntegration
            chatRoomId={chatRoomId}
            userName={userName}
            userId={userId}
            socket={socket}
          />
        </div>
      )}

      {/* Active Video Call */}
      {isInCall && incomingCall && (
        <DailyVideoCallIntegration
          chatRoomId={chatRoomId}
          userName={userName}
          userId={userId}
          socket={socket}
        />
      )}


    </div>
  );
};

export default ChatRoomVideoIntegration;