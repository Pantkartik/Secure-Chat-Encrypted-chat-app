
import React, { useState, useEffect, useRef } from "react"
import { useSocket } from '../contexts/SocketContext'
import SimplePeer from "simple-peer"

interface CallParticipant {
  id: string
  name: string
  stream?: MediaStream
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  connectionQuality?: 'good' | 'poor' | 'disconnected'
}

interface SimplePeerVideoCallProps {
  roomId?: string
  isGroupCall?: boolean
  onCallEnd?: () => void
  targetUserId?: string
  isAudioOnly?: boolean
}

const SimplePeerVideoCallImproved: React.FC<SimplePeerVideoCallProps> = ({ 
  roomId, 
  isGroupCall = false, 
  onCallEnd,
  targetUserId,
  isAudioOnly = false
}) => {
  const { socket, sessionId, username } = useSocket()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<Map<string, SimplePeer.Instance>>(new Map())
  const [participants, setParticipants] = useState<Map<string, CallParticipant>>(new Map())
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isInCall, setIsInCall] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isMountedRef = useRef(true)
  const mediaInitializationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize media with improved error handling
  const initializeMedia = async () => {
    setIsLoading(true)
    setError(null)
    
    // Set timeout for media initialization
    mediaInitializationTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setError('Media initialization timed out')
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isAudioOnly ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        }
      })
      
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      
      // Clear timeout on success
      if (mediaInitializationTimeoutRef.current) {
        clearTimeout(mediaInitializationTimeoutRef.current)
        mediaInitializationTimeoutRef.current = null
      }
      
      setLocalStream(stream)
      streamRef.current = stream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
        localVideoRef.current.play().catch(console.error)
      }
      
      setIsVideoEnabled(!isAudioOnly && stream.getVideoTracks().length > 0)
      setIsAudioEnabled(stream.getAudioTracks().length > 0)
      
    } catch (error: any) {
      console.error('Error accessing media:', error)
      
      let errorMessage = 'Failed to access camera/microphone'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access was denied. Please allow access in your browser settings.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found. Please check your device.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is already in use by another application.'
      }
      
      if (isMountedRef.current) {
        setError(errorMessage)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
      
      // Clear timeout
      if (mediaInitializationTimeoutRef.current) {
        clearTimeout(mediaInitializationTimeoutRef.current)
        mediaInitializationTimeoutRef.current = null
      }
    }
  }

  // Create a new peer connection with improved configuration
  const createPeer = (userId: string, initiator: boolean = false): SimplePeer.Instance => {
    console.log(`Creating peer for ${userId}, initiator: ${initiator}`)
    
    const peer = new SimplePeer({
      initiator,
      trickle: false, // Disable trickle for better reliability
      stream: localStream || undefined,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      }
    })

    // Handle signaling data with error handling
    peer.on('signal', (data: SimplePeer.SignalData) => {
      if (!isMountedRef.current) return
      
      console.log(`Sending signal to ${userId}:`, data.type)
      
      try {
        socket?.emit('simple-peer-signal', {
          to: userId,
          from: sessionId,
          signal: data,
          roomId
        })
      } catch (error) {
        console.error('Error sending signal:', error)
      }
    })

    // Handle incoming stream
    peer.on('stream', (stream: MediaStream) => {
      if (!isMountedRef.current) return
      
      console.log(`Received stream from ${userId}`, {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      })
      
      setParticipants(prev => {
        const updated = new Map(prev)
        const participant = updated.get(userId) || {
          id: userId,
          name: `User ${userId.slice(0, 6)}`,
          isVideoEnabled: false,
          isAudioEnabled: false,
          connectionQuality: 'good'
        }
        participant.stream = stream
        participant.isVideoEnabled = stream.getVideoTracks().length > 0
        participant.isAudioEnabled = stream.getAudioTracks().length > 0
        updated.set(userId, participant)
        return updated
      })
    })

    // Handle connection
    peer.on('connect', () => {
      if (!isMountedRef.current) return
      
      console.log(`Connected to ${userId}`)
      setIsInCall(true)
      setCallStartTime(new Date())
      
      // Update participant connection quality
      setParticipants(prev => {
        const updated = new Map(prev)
        const participant = updated.get(userId)
        if (participant) {
          participant.connectionQuality = 'good'
        }
        return updated
      })
    })

    // Handle errors with recovery
    peer.on('error', (err: Error) => {
      if (!isMountedRef.current) return
      
      console.error(`Peer error with ${userId}:`, err)
      setError(`Connection error with ${userId}: ${err.message}`)
      
      // Update participant connection quality
      setParticipants(prev => {
        const updated = new Map(prev)
        const participant = updated.get(userId)
        if (participant) {
          participant.connectionQuality = 'disconnected'
        }
        return updated
      })
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (isMountedRef.current && isInCall) {
          console.log(`Attempting to reconnect to ${userId}`)
          cleanupPeer(userId)
          
          if (socket && localStream) {
            const newPeer = createPeer(userId, true)
            setPeers(prev => new Map(prev.set(userId, newPeer)))
          }
        }
      }, 3000)
    })

    // Handle close
    peer.on('close', () => {
      if (!isMountedRef.current) return
      
      console.log(`Peer connection closed with ${userId}`)
      cleanupPeer(userId)
    })

    return peer
  }

  // Handle incoming signals with improved logic
  const handleSignal = (data: { from: string; signal: SimplePeer.SignalData; roomId?: string }) => {
    const { from, signal } = data
    
    // Skip if it's our own signal or component is unmounted
    if (from === sessionId || !isMountedRef.current) return
    
    console.log(`Received signal from ${from}:`, signal.type)
    
    let peer = peers.get(from)
    
    if (!peer) {
      // Create new peer as non-initiator
      peer = createPeer(from, false)
      setPeers(prev => new Map(prev.set(from, peer!)))
    }
    
    // Process the signal with error handling
    try {
      peer.signal(signal)
    } catch (error) {
      console.error(`Error processing signal from ${from}:`, error)
      setError(`Failed to process signal from ${from}`)
    }
  }

  // Start a call with improved logic
  const startCall = async (targetUserId?: string) => {
    if (!localStream) {
      await initializeMedia()
      
      // Wait for media to be ready
      if (!localStream) {
        setError('Failed to access media devices')
        return
      }
    }
    
    if (!socket || !localStream) return
    
    try {
      if (isGroupCall && roomId) {
        // Join room for group call
        socket.emit('join-simple-peer-room', { roomId, userId: sessionId })
      } else if (targetUserId) {
        // Start individual call
        const peer = createPeer(targetUserId, true)
        setPeers(prev => new Map(prev.set(targetUserId, peer)))
        
        // Notify the other user
        socket.emit('simple-peer-call-request', {
          to: targetUserId,
          from: sessionId,
          callerName: username,
          roomId
        })
      }
    } catch (error) {
      console.error('Error starting call:', error)
      setError('Failed to start call')
    }
  }

  // Answer a call with improved logic
  const answerCall = async (fromUserId: string) => {
    if (!localStream) {
      await initializeMedia()
      
      if (!localStream) {
        setError('Failed to access media devices')
        return
      }
    }
    
    if (!localStream) return
    
    try {
      const peer = createPeer(fromUserId, false)
      setPeers(prev => new Map(prev.set(fromUserId, peer)))
      setIsInCall(true)
      setIncomingCall(null)
    } catch (error) {
      console.error('Error answering call:', error)
      setError('Failed to answer call')
    }
  }

  // End call with comprehensive cleanup
  const endCall = () => {
    console.log('Ending call...')
    
    // Destroy all peer connections
    peers.forEach((peer, userId) => {
      cleanupPeer(userId)
    })
    
    // Clean up local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop()
        track.onended = null
      })
      setLocalStream(null)
      streamRef.current = null
    }
    
    // Clear video element sources
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    
    setIsInCall(false)
    setCallStartTime(null)
    setCallDuration(0)
    setParticipants(new Map())
    setIncomingCall(null)
    
    // Notify others
    if (socket && isInCall) {
      socket.emit('simple-peer-call-end', { roomId, from: sessionId })
    }
    
    onCallEnd?.()
  }

  // Clean up a peer connection with proper cleanup
  const cleanupPeer = (userId: string) => {
    const peer = peers.get(userId)
    if (peer) {
      console.log(`Cleaning up peer connection for ${userId}`)
      
      // Destroy the peer connection
      peer.destroy()
      
      // Remove from state
      setPeers(prev => {
        const updated = new Map(prev)
        updated.delete(userId)
        return updated
      })
      
      // Remove participant
      setParticipants(prev => {
        const updated = new Map(prev)
        updated.delete(userId)
        return updated
      })
    }
  }

  // Toggle video with improved error handling
  const toggleVideo = async () => {
    if (!localStream) return
    
    const videoTracks = localStream.getVideoTracks()
    if (videoTracks.length > 0) {
      const newState = !isVideoEnabled
      
      // Use delay to prevent rapid toggling
      setTimeout(() => {
        videoTracks.forEach(track => {
          track.enabled = newState
        })
        setIsVideoEnabled(newState)
        
        // Update peers with retry logic
        const updatePromises = Array.from(peers.entries()).map(async ([userId, peer]) => {
          try {
            const sender = (peer as any)._pc?.getSenders().find((s: any) => s.track?.kind === 'video')
            if (sender && videoTracks[0]) {
              await sender.replaceTrack(videoTracks[0])
            }
          } catch (error) {
            console.error(`Failed to update video track for ${userId}:`, error)
          }
        })
        
        Promise.all(updatePromises).catch(console.error)
      }, 100)
    } else if (!isAudioOnly) {
      // Try to get video track if none exists
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const videoTrack = videoStream.getVideoTracks()[0]
        if (videoTrack) {
          localStream.addTrack(videoTrack)
          setIsVideoEnabled(true)
        }
      } catch (error) {
        console.error('Failed to get video track:', error)
        setError('Unable to access camera')
      }
    }
  }

  // Toggle audio with microphone blinking fix
  const toggleAudio = async () => {
    if (!localStream) return
    
    const audioTracks = localStream.getAudioTracks()
    if (audioTracks.length > 0) {
      const newState = !isAudioEnabled
      
      // Use delay to prevent microphone blinking
      setTimeout(() => {
        audioTracks.forEach(track => {
          track.enabled = newState
        })
        setIsAudioEnabled(newState)
        
        // Update peers with retry logic
        const updatePromises = Array.from(peers.entries()).map(async ([userId, peer]) => {
          try {
            const sender = (peer as any)._pc?.getSenders().find((s: any) => s.track?.kind === 'audio')
            if (sender && audioTracks[0]) {
              await sender.replaceTrack(audioTracks[0])
            }
          } catch (error) {
            console.error(`Failed to update audio track for ${userId}:`, error)
          }
        })
        
        Promise.all(updatePromises).catch(console.error)
      }, 100)
    } else {
      // Try to get audio track if none exists
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        const audioTrack = audioStream.getAudioTracks()[0]
        if (audioTrack) {
          localStream.addTrack(audioTrack)
          setIsAudioEnabled(true)
        }
      } catch (error) {
        console.error('Failed to get audio track:', error)
        setError('Unable to access microphone')
      }
    }
  }

  // Calculate call duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isInCall && callStartTime) {
      interval = setInterval(() => {
        if (isMountedRef.current) {
          setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000))
        }
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isInCall, callStartTime])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleSignal = (data: any) => {
      if (data.from !== sessionId) {
        handleSignal(data)
      }
    }

    const handleCallRequest = (data: { from: string; callerName: string }) => {
      if (data.from !== sessionId) {
        setIncomingCall(data)
      }
    }

    const handleCallEnd = () => {
      endCall()
    }

    const handleUserJoined = ({ userId }: { userId: string }) => {
      if (isGroupCall && isInCall && userId !== sessionId && localStream) {
        // Auto-connect to new user in group call
        const peer = createPeer(userId, true)
        setPeers(prev => new Map(prev.set(userId, peer)))
      }
    }

    const handleUserLeft = ({ userId }: { userId: string }) => {
      cleanupPeer(userId)
    }

    socket.on('simple-peer-signal', handleSignal)
    socket.on('simple-peer-call-request', handleCallRequest)
    socket.on('simple-peer-call-end', handleCallEnd)
    socket.on('user-joined', handleUserJoined)
    socket.on('user-left', handleUserLeft)

    return () => {
      socket.off('simple-peer-signal', handleSignal)
      socket.off('simple-peer-call-request', handleCallRequest)
      socket.off('simple-peer-call-end', handleCallEnd)
      socket.off('user-joined', handleUserJoined)
      socket.off('user-left', handleUserLeft)
    }
  }, [socket, sessionId, isGroupCall, isInCall, localStream])

  // Initialize media on mount
  useEffect(() => {
    isMountedRef.current = true
    initializeMedia()
    
    return () => {
      isMountedRef.current = false
      endCall()
      
      // Clear any pending timeouts
      if (mediaInitializationTimeoutRef.current) {
        clearTimeout(mediaInitializationTimeoutRef.current)
      }
    }
  }, [])

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="simple-peer-video-call">
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {incomingCall && (
        <div className="incoming-call">
          <p>Incoming call from {incomingCall.callerName}</p>
          <button onClick={() => answerCall(incomingCall.from)}>Answer</button>
          <button onClick={() => setIncomingCall(null)}>Decline</button>
        </div>
      )}
      
      <div className="video-grid">
        {/* Local video */}
        <div className="video-tile local">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-element"
          />
          <div className="video-overlay">
            <span className="participant-name">You ({username})</span>
            {!isVideoEnabled && (
              <div className="video-disabled-indicator">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="opacity-50">
                  <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.5l4 4H17v3.5l4 4V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                </svg>
                <span className="text-sm mt-2">Camera Off</span>
              </div>
            )}
            {!isAudioEnabled && (
              <div className="audio-disabled-indicator">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 .04.01.08.01.12l2.9-2.9zM5.27 3L3 5.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .46 0 .89-.11 1.28-.29l2.88 2.88c-1.13.53-2.39.84-3.74.84-3.52 0-6.39-2.57-6.9-6H1c.55 3.38 3.14 6 6.46 6 2.01 0 3.81-.83 5.13-2.17L19.73 21 21 19.73 5.27 3z"/>
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* Remote videos */}
        {Array.from(participants.values()).map((participant) => (
          <div key={participant.id} className="video-tile remote">
            {participant.stream ? (
              <video
                autoPlay
                playsInline
                className="video-element"
                ref={(el) => {
                  if (el && participant.stream) {
                    el.srcObject = participant.stream
                  }
                }}
              />
            ) : (
              <div className="video-placeholder">
                <div className="loading-spinner">Loading...</div>
              </div>
            )}
            <div className="video-overlay">
              <span className="participant-name">{participant.name}</span>
              {!participant.isVideoEnabled && (
                <div className="video-disabled-indicator">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="opacity-50">
                    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.5l4 4H17v3.5l4 4V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                  </svg>
                  <span className="text-sm mt-2">Camera Off</span>
                </div>
              )}
              {!participant.isAudioEnabled && (
                <div className="audio-disabled-indicator">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 .04.01.08.01.12l2.9-2.9zM5.27 3L3 5.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .46 0 .89-.11 1.28-.29l2.88 2.88c-1.13.53-2.39.84-3.74.84-3.52 0-6.39-2.57-6.9-6H1c.55 3.38 3.14 6 6.46 6 2.01 0 3.81-.83 5.13-2.17L19.73 21 21 19.73 5.27 3z"/>
                  </svg>
                </div>
              )}
              {participant.connectionQuality === 'poor' && (
                <div className="connection-indicator poor" title="Poor connection">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                </div>
              )}
              {participant.connectionQuality === 'disconnected' && (
                <div className="connection-indicator disconnected" title="Disconnected">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Call controls */}
      <div className="call-controls">
        <div className="call-info">
          {isInCall && callStartTime && (
            <span className="call-duration">{formatDuration(callDuration)}</span>
          )}
        </div>
        
        <div className="control-buttons">
          <button
            onClick={toggleVideo}
            className={`control-button video-toggle ${!isVideoEnabled ? 'disabled' : ''}`}
            title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
            disabled={isAudioOnly}
          >
            {isVideoEnabled ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.5l4 4H17v3.5l4 4V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={toggleAudio}
            className={`control-button audio-toggle ${!isAudioEnabled ? 'disabled' : ''}`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 .04.01.08.01.12l2.9-2.9zM5.27 3L3 5.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .46 0 .89-.11 1.28-.29l2.88 2.88c-1.13.53-2.39.84-3.74.84-3.52 0-6.39-2.57-6.9-6H1c.55 3.38 3.14 6 6.46 6 2.01 0 3.81-.83 5.13-2.17L19.73 21 21 19.73 5.27 3z"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={endCall}
            className="control-button end-call"
            title="End call"
            disabled={!isInCall && !isCalling}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .5-.4.9-.9.9s-.9-.4-.9-.9V8.72c-1.45-.47-3-.72-4.6-.72-2.21 0-4 1.79-4 4s1.79 4 4 4c1.6 0 3.15-.25 4.6-.72v3.1c0 .5.4.9.9.9s.9-.4.9-.9v-3.1c1.45.47 3 .72 4.6.72 2.21 0 4-1.79 4-4s-1.79-4-4-4z"/>
            </svg>
          </button>
        </div>
        
        <div className="call-actions">
          {!isInCall && !isCalling && (
            <button
              onClick={() => startCall(targetUserId)}
              className="start-call-button"
              disabled={isLoading || !localStream}
            >
              {isLoading ? 'Loading...' : targetUserId ? `Call ${targetUserId}` : 'Start Call'}
            </button>
          )}
          
          {isCalling && !isInCall && (
            <div className="calling-indicator">
              <span>Calling...</span>
              <button onClick={() => setIsCalling(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimplePeerVideoCallImproved