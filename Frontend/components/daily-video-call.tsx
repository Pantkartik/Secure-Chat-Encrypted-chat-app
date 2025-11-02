"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, Users } from "lucide-react"

// Note: You would need to install Daily.co SDK
// npm install @daily-co/daily-js

interface DailyVideoCallProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  username: string
  dailyApiKey?: string
  isAudioOnly?: boolean
}

export default function DailyVideoCall({
  isOpen,
  onClose,
  sessionId,
  username,
  dailyApiKey,
  isAudioOnly = false
}: DailyVideoCallProps) {
  const [callFrame, setCallFrame] = useState<any>(null)
  const [isInCall, setIsInCall] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)

  const callFrameRef = useRef<HTMLDivElement>(null)

  // Initialize Daily.co call
  useEffect(() => {
    if (!isOpen || !callFrameRef.current) return

    const initDailyCall = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const DailyIframe = (await import('@daily-co/daily-js')).DailyIframe
        
        // Create room (in production, this would be done server-side)
        const roomResponse = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dailyApiKey}`
          },
          body: JSON.stringify({
            name: sessionId,
            privacy: 'public',
            properties: {
              max_participants: 10,
              enable_screenshare: true,
              enable_chat: true
            }
          })
        })

        if (!roomResponse.ok) {
          throw new Error('Failed to create room')
        }

        const roomData = await roomResponse.json()
        const roomUrl = roomData.url

        // Create call frame
        const frame = DailyIframe.wrap(callFrameRef.current, {
          showLeaveButton: false,
          showFullscreenButton: false,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none'
          }
        })

        setCallFrame(frame)

        // Event handlers
        frame.on('joined-meeting', (event: any) => {
          console.log('Joined meeting:', event)
          setIsInCall(true)
        })

        frame.on('left-meeting', (event: any) => {
          console.log('Left meeting:', event)
          setIsInCall(false)
          onClose()
        })

        frame.on('participant-joined', (event: any) => {
          console.log('Participant joined:', event)
          setParticipants(prev => [...prev, event.participant])
        })

        frame.on('participant-left', (event: any) => {
          console.log('Participant left:', event)
          setParticipants(prev => prev.filter(p => p.session_id !== event.participant.session_id))
        })

        frame.on('error', (error: any) => {
          console.error('Daily.co error:', error)
          alert('Video call error occurred')
        })

        // Join the call
        await frame.join({
          url: roomUrl,
          userName: username
        })

      } catch (error) {
        console.error('Daily.co initialization error:', error)
        alert('Failed to initialize video call')
      }
    }

    initDailyCall()

    return () => {
      // Cleanup
      if (callFrame) {
        callFrame.leave()
        callFrame.destroy()
      }
    }
  }, [isOpen, dailyApiKey, sessionId, username, onClose])

  // Control functions
  const toggleAudio = () => {
    if (callFrame) {
      if (isAudioEnabled) {
        callFrame.setLocalAudio(false)
      } else {
        callFrame.setLocalAudio(true)
      }
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  const toggleVideo = () => {
    if (callFrame) {
      if (isVideoEnabled) {
        callFrame.setLocalVideo(false)
      } else {
        callFrame.setLocalVideo(true)
      }
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const endCall = () => {
    if (callFrame) {
      callFrame.leave()
    }
    setIsInCall(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <Card className="w-full max-w-6xl h-[90vh] bg-gray-900 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">
            Video Call ({participants.length + 1} participants)
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-300">
              Room: {sessionId}
            </div>
            <Button variant="ghost" size="icon" onClick={endCall}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Video area */}
          <div className="flex-1 relative">
            <div 
              ref={callFrameRef} 
              className="w-full h-full"
            />

            {/* Call controls overlay */}
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

          {/* Participants info */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}