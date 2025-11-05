import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import './DailyVideoCall.css';

interface DailyVideoCallProps {
  roomUrl: string;
  userName: string;
  onCallEnd?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const DailyVideoCall: React.FC<DailyVideoCallProps> = ({
  roomUrl,
  userName,
  onCallEnd,
  isMinimized = false,
  onToggleMinimize
}) => {
  const callFrameRef = useRef<any>(null);
  const iframeRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState(1);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    if (!roomUrl || !iframeRef.current) return;

    // Initialize Daily.co call frame
    const initCallFrame = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create the call frame
        if (!iframeRef.current) return;
        const callFrame = DailyIframe.createFrame(iframeRef.current, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px'
          }
        });

        callFrameRef.current = callFrame;

        // Event handlers
        callFrame.on('loaded', () => {
          console.log('Daily.co call frame loaded');
          setIsLoading(false);
        });

        callFrame.on('started-camera', () => {
          console.log('Camera started');
        });

        callFrame.on('joined-meeting', (event) => {
          console.log('Joined meeting:', event);
          setIsLoading(false);
        });

        callFrame.on('participant-joined', (event) => {
          console.log('Participant joined:', event);
          setParticipants(prev => prev + 1);
        });

        callFrame.on('participant-left', (event) => {
          console.log('Participant left:', event);
          setParticipants(prev => Math.max(1, prev - 1));
        });

        callFrame.on('left-meeting', () => {
          console.log('Left meeting');
          onCallEnd?.();
        });

        callFrame.on('error', (error) => {
          console.error('Daily.co error:', error);
          setError(error.errorMsg || 'An error occurred');
          setIsLoading(false);
        });

        callFrame.on('camera-error', (error) => {
          console.error('Camera error:', error);
          setError('Camera access denied or not available');
        });

        callFrame.on('network-quality-change', (event) => {
          console.log('Network quality changed:', event);
        });

        // Join the room
        await callFrame.join({ 
          url: roomUrl,
          userName: userName
        });

      } catch (err) {
        console.error('Failed to initialize Daily.co:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize video call');
        setIsLoading(false);
      }
    };

    initCallFrame();

    // Cleanup function
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [roomUrl, userName, onCallEnd]);

  const handleLeaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
    }
  };

  const handleToggleVideo = () => {
    if (callFrameRef.current) {
      const newState = !isVideoMuted;
      callFrameRef.current.setLocalVideo(newState);
      setIsVideoMuted(newState);
    }
  };

  const handleToggleAudio = () => {
    if (callFrameRef.current) {
      const newState = !isAudioMuted;
      callFrameRef.current.setLocalAudio(newState);
      setIsAudioMuted(newState);
    }
  };

  const handleToggleScreenShare = () => {
    if (callFrameRef.current) {
      callFrameRef.current.startScreenShare();
    }
  };

  if (error) {
    return (
      <div className="video-call-error">
        <div className="error-content">
          <h3>❌ Video Call Error</h3>
          <p>{error}</p>
          <button onClick={onCallEnd} className="error-button">
            Close Video Call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`daily-video-call ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="video-call-header">
        <div className="header-left">
          <span className="participants-count">
            👥 {participants} {participants === 1 ? 'person' : 'people'}
          </span>
          {isLoading && <span className="loading-text">Connecting...</span>}
        </div>
        <div className="header-right">
          <button
            onClick={onToggleMinimize}
            className="header-button minimize-button"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? '⬜' : '🗕'}
          </button>
          <button
            onClick={handleLeaveCall}
            className="header-button leave-button"
            title="Leave call"
          >
            📞
          </button>
        </div>
      </div>

      {/* Controls */}
      {!isMinimized && (
        <div className="video-call-controls">
          <button
            onClick={handleToggleVideo}
            className={`control-button ${isVideoMuted ? 'muted' : ''}`}
            title={isVideoMuted ? 'Enable video' : 'Disable video'}
          >
            {isVideoMuted ? '📹' : '📹'}
          </button>
          <button
            onClick={handleToggleAudio}
            className={`control-button ${isAudioMuted ? 'muted' : ''}`}
            title={isAudioMuted ? 'Enable audio' : 'Disable audio'}
          >
            {isAudioMuted ? '🎤' : '🎤'}
          </button>
          <button
            onClick={handleToggleScreenShare}
            className="control-button"
            title="Share screen"
          >
            🖥️
          </button>
        </div>
      )}

      {/* Video Frame */}
      <div className="video-frame-container">
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Connecting to video call...</p>
          </div>
        )}
        <div ref={iframeRef} className="video-frame" />
      </div>
    </div>
  );
};

export default DailyVideoCall;