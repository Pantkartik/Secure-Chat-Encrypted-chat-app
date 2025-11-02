"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from "lucide-react"

// Note: You would need to install PeerJS
// npm install peerjs

interface PeerJSVideoCallProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  username: string
  peerServerHost?: string
  peerServerPort?: number
  isAudioOnly?: boolean
}

export default function PeerJSVideoCall({
  isOpen,
  onClose,
  sessionId,
  username,
  peerServerHost = '0.peerjs.com',
  peerServerPort = 443,
  isAudioOnly = false
}: PeerJSVideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peer, setPeer] = useState<any>(null)
  const [currentCall, setCurrentCall] = useState<any>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isCalling, setIsCalling] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [myPeerId, setMyPeerId] = useState<string>('')

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Initialize PeerJS
  useEffect(() => {
    if (!isOpen) return

    const initPeerJS = async () => {
      try {
        const PeerJS = (await import('peerjs')).default
        
        const peerInstance = new PeerJS(`${sessionId}-${username}`, {
          host: peerServerHost,
          port: peerServerPort,
          secure: peerServerPort === 443
        })

        setPeer(peerInstance)

        peerInstance.on('open', (id: string) => {
          console.log('My peer ID is:', id)
          setMyPeerId(id)
        })

        peerInstance.on('call', (call: any) => {
          console.log('Incoming call from:', call.peer)
          setIncomingCall(call)
        })

        peerInstance.on('error', (error: any) => {
          console.error('PeerJS error:', error)
          alert('Connection error: ' + error.message)
        })

        peerInstance.on('disconnected', () => {
          console.log('PeerJS disconnected')
          setIsInCall(false)
        })

      } catch (error) {
        console.error('PeerJS initialization error:', error)
        alert('Failed to initialize peer connection')
      }
    }

    initPeerJS()

    return () => {
      if (peer) {
        peer.destroy()
      }
    }
  }, [isOpen, sessionId, username, peerServerHost, peerServerPort])

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

  // Answer incoming call
  const answerCall = async (call: any) => {
    if (!localStream) {
      await initializeMedia()
    }

    setTimeout(() => {
      call.answer(localStream)
      setupCallHandlers(call)
      setIncomingCall(null)
    }, 500)
  }

  // Setup call event handlers
  const setupCallHandlers = (call: any) => {
    setCurrentCall(call)
    setIsInCall(true)

    call.on('stream', (remoteStream: MediaStream) => {
      console.log('Received remote stream')
      setRemoteStream(remoteStream)
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
        remoteVideoRef.current.play().catch(console.error)
      }
    })

    call.on('close', () => {
      console.log('Call closed')
      endCall()
    })

    call.on('error', (error: any) => {
      console.error('Call error:', error)
      endCall()
    })
  }

  // Start call
  const startCall = async () => {
    if (!peer || !myPeerId) return

    if (!localStream) {
      await initializeMedia()
    }

    setTimeout(() => {
      setIsCalling(true)
      const targetPeerId = `${sessionId}-${targetUserId || 'other'}`
      const call = peer.call(targetPeerId, localStream)
      setupCallHandlers(call)
      setIsCalling(false)
    }, 500)
  }

  // End call
  const endCall = () => {
    if (currentCall) {
      currentCall.close()
      setCurrentCall(null)
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">ID: {myPeerId}</span>
            <Button variant="ghost" size="icon" onClick={endCall}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Incoming call notification */}
          {incomingCall && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
              <div className="text-center">
                <h3 className="text-xl mb-4">Incoming Call</h3>
                <p className="mb-6">From: {incomingCall.peer}</p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => answerCall(incomingCall)}
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
                disabled={isCalling || !myPeerId}
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