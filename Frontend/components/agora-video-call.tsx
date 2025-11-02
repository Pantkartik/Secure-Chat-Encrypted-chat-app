"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from "lucide-react"

// Note: You would need to install Agora SDK
// npm install agora-rtc-sdk-ng

interface AgoraVideoCallProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  username: string
  agoraAppId: string
  agoraToken?: string
  isAudioOnly?: boolean
}

export default function AgoraVideoCall({
  isOpen,
  onClose,
  sessionId,
  username,
  agoraAppId,
  agoraToken,
  isAudioOnly = false
}: AgoraVideoCallProps) {
  const [localStream, setLocalStream] = useState<any>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, any>>(new Map())
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isInCall, setIsInCall] = useState(false)
  const [client, setClient] = useState<any>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null)

  // Initialize Agora client
  useEffect(() => {
    if (!isOpen) return

    const initAgora = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        
        const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        setClient(agoraClient)

        // Event handlers
        agoraClient.on('user-published', async (user: any, mediaType: string) => {
          await agoraClient.subscribe(user, mediaType)
          
          if (mediaType === 'video') {
            const remoteVideoTrack = user.videoTrack
            setRemoteStreams(prev => new Map(prev.set(user.uid, remoteVideoTrack)))
            
            // Play video
            if (remoteVideoContainerRef.current) {
              const remoteVideoElement = document.createElement('div')
              remoteVideoElement.id = `remote-${user.uid}`
              remoteVideoContainerRef.current.appendChild(remoteVideoElement)
              remoteVideoTrack.play(remoteVideoElement)
            }
          }
          
          if (mediaType === 'audio') {
            const remoteAudioTrack = user.audioTrack
            remoteAudioTrack.play()
          }
        })

        agoraClient.on('user-unpublished', (user: any, mediaType: string) => {
          if (mediaType === 'video') {
            setRemoteStreams(prev => {
              const newMap = new Map(prev)
              newMap.delete(user.uid)
              return newMap
            })
            
            // Remove video element
            const remoteVideoElement = document.getElementById(`remote-${user.uid}`)
            if (remoteVideoElement) {
              remoteVideoElement.remove()
            }
          }
        })

        // Join channel
        await agoraClient.join(agoraAppId, sessionId, agoraToken || null, sessionId)
        
        // Create and publish local stream
        const localAgoraStream = AgoraRTC.createStream({
          streamID: sessionId,
          audio: true,
          video: !isAudioOnly,
          screen: false
        })
        
        await localAgoraStream.init()
        await localAgoraStream.play(localVideoRef.current!)
        await agoraClient.publish(localAgoraStream)
        
        setLocalStream(localAgoraStream)
        setIsInCall(true)
        
      } catch (error) {
        console.error('Agora initialization error:', error)
        alert('Failed to initialize video call')
      }
    }

    initAgora()

    return () => {
      // Cleanup
      if (client) {
        client.leave()
      }
      if (localStream) {
        localStream.close()
      }
    }
  }, [isOpen, agoraAppId, sessionId, agoraToken, isAudioOnly])

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      if (isAudioEnabled) {
        localStream.muteAudio()
      } else {
        localStream.unmuteAudio()
      }
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStream && !isAudioOnly) {
      if (isVideoEnabled) {
        localStream.muteVideo()
      } else {
        localStream.unmuteVideo()
      }
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  // End call
  const endCall = () => {
    if (client) {
      client.leave()
    }
    if (localStream) {
      localStream.close()
    }
    setIsInCall(false)
    onClose()
  }

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
          {/* Video area */}
          <div className="flex-1 relative">
            {/* Remote videos */}
            <div 
              ref={remoteVideoContainerRef} 
              className="w-full h-full flex flex-wrap gap-2"
            />

            {/* Local video (picture-in-picture) */}
            {!isAudioOnly && (
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
        </CardContent>
      </Card>
    </div>
  )
}