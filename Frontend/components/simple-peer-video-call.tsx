"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSocket } from '../contexts/SocketContext'
import SimplePeer from "simple-peer"

interface SimplePeerVideoCallProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  username: string
  socket: any
  targetUserId?: string
  isAudioOnly?: boolean
}

export default function SimplePeerVideoCall({
  isOpen,
  onClose,
  sessionId,
  username,
  socket,
  targetUserId,
  isAudioOnly = false
}: SimplePeerVideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isCalling, setIsCalling] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState<any>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Initialize media
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isAudioOnly,
        audio: true
      })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
        localVideoRef.current.play().catch(console.error)
      }
    } catch (error) {
      console.error('Error accessing media:', error)
      alert('Failed to access camera/microphone')
    }
  }

  // Create peer connection as initiator
  const createPeerConnection = (isInitiator: boolean) => {
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: false,
      stream: localStream || undefined
    })

    peer.on('signal', (data) => {
      socket.emit('simplePeerSignal', {
        targetUserId: targetUserId || sessionId,
        signal: data,
        callerName: username,
        isAudioOnly
      })
    })

    peer.on('stream', (stream) => {
      setRemoteStream(stream)
      setIsInCall(true)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
        remoteVideoRef.current.play().catch(console.error)
      }
    })

    peer.on('error', (error) => {
      console.error('Peer error:', error)
      endCall()
    })

    peer.on('connect', () => {
      console.log('Peer connected')
      setIsInCall(true)
    })

    peer.on('close', () => {
      console.log('Peer closed')
      endCall()
    })

    setPeer(peer)
    return peer
  }

  // Start call
  const startCall = async () => {
    if (!localStream) {
      await initializeMedia()
    }

    setTimeout(() => {
      setIsCalling(true)
      createPeerConnection(true)
    }, 500)
  }

  // Answer call
  const answerCall = async (signal: any) => {
    if (!localStream) {
      await initializeMedia()
    }

    setTimeout(() => {
      const peer = createPeerConnection(false)
      peer.signal(signal)
      setIncomingCall(null)
    }, 500)
  }

  // End call
  const endCall = () => {
    if (peer) {
      peer.destroy()
      setPeer(null)
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
      setRemoteStream(null)
    }

    setIsCalling(false)
    setIsInCall(false)
    setIncomingCall(null)
    onClose()
  }

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
        setIsAudioEnabled(!isAudioEnabled)
      }
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
        setIsVideoEnabled(!isVideoEnabled)
      }
    }
  }

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleSimplePeerSignal = (data: any) => {
      if (data.targetUserId === sessionId) {
        if (!isInCall && !incomingCall) {
          setIncomingCall(data)
        } else if (peer) {
          peer.signal(data.signal)
        }
      }
    }

    socket.on('simplePeerSignal', handleSimplePeerSignal)

    return () => {
      socket.off('simplePeerSignal', handleSimplePeerSignal)
    }
  }, [socket, sessionId, isInCall, incomingCall, peer])

  // Initialize media on mount
  useEffect(() => {
    if (isOpen && !localStream) {
      initializeMedia()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <Card className="w-full max-w-4xl h-[80vh] bg-gray-900 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">
            {isAudioOnly ? 'Audio Call' : 'Video Call'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={endCall}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Incoming call notification */}
          {incomingCall && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
              <div className="text-center">
                <h3 className="text-xl mb-4">
                  Incoming {incomingCall.isAudioOnly ? 'Audio' : 'Video'} Call
                </h3>
                <p className="mb-6">From: {incomingCall.callerName}</p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => answerCall(incomingCall.signal)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Answer
                  </Button>
                  <Button
                    onClick={() => setIncomingCall(null)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Video area */}
          <div className="flex-1 relative">
            {/* Remote video */}
            {remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
            )}

            {/* Local video (picture-in-picture) */}
            {!isAudioOnly && localStream && (
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Call controls */}
            {isInCall && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                <Button
                  onClick={toggleAudio}
                  variant={isAudioEnabled ? "default" : "destructive"}
                  size="icon"
                  className="rounded-full w-12 h-12"
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                {!isAudioOnly && (
                  <Button
                    onClick={toggleVideo}
                    variant={isVideoEnabled ? "default" : "destructive"}
                    size="icon"
                    className="rounded-full w-12 h-12"
                  >
                    {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </Button>
                )}
                <Button
                  onClick={endCall}
                  variant="destructive"
                  size="icon"
                  className="rounded-full w-12 h-12"
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Start call button */}
          {!isInCall && !incomingCall && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={startCall}
                disabled={isCalling}
                className="bg-green-600 hover:bg-green-700"
              >
                <Phone className="w-5 h-5 mr-2" />
                {isCalling ? 'Calling...' : 'Start Call'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}