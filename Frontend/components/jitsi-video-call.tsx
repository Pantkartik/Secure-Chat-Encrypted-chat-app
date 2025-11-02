'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, PhoneOff, Video, Users, Settings, Minimize2, Maximize2, X, Mic, MicOff, VideoOff, AlertCircle } from 'lucide-react'

interface JitsiVideoCallProps {
  isOpen: boolean
  onClose: () => void
  targetUserId?: string
  isAudioOnly?: boolean
  isGroupCall?: boolean
  roomName?: string
  username?: string
  sessionId?: string
}

export default function JitsiVideoCall({
  isOpen,
  onClose,
  targetUserId,
  isAudioOnly = false,
  isGroupCall = false,
  roomName,
  username = 'User',
  sessionId
}: JitsiVideoCallProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const [jitsiApi, setJitsiApi] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadJitsi = async () => {
      try {
        setIsLoading(true)
        setConnectionError(null)
        
        // Load Jitsi Meet API script
        if (!(window as any).JitsiMeetExternalAPI) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://meet.jit.si/external_api.js'
            script.async = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load Jitsi script'))
            document.head.appendChild(script)
          })
        }

        if (jitsiContainerRef.current && (window as any).JitsiMeetExternalAPI) {
          const domain = 'meet.jit.si'
          
          // Generate cryptographically secure room name
          let room: string
          if (roomName) {
            room = roomName
          } else if (sessionId) {
            // Create cryptographically secure room name from session ID
            const timestamp = Date.now().toString(36)
            const crypto = window.crypto || (window as any).msCrypto
            const array = new Uint8Array(8)
            crypto.getRandomValues(array)
            const secureRandom = Array.from(array, byte => byte.toString(36)).join('').substring(0, 8)
            
            // For private chats, ensure consistent room naming
            if (isGroupCall === false && targetUserId && username) {
              const sortedIds = [username, targetUserId].sort().join('-')
              room = `cypher-private-${sortedIds}-${timestamp}-${secureRandom}`
            } else {
              room = `cypher-secure-${sessionId}-${timestamp}-${secureRandom}`
            }
          } else {
            // Fallback secure room name with crypto random
            const timestamp = Date.now().toString(36)
            const crypto = window.crypto || (window as any).msCrypto
            const array = new Uint8Array(8)
            crypto.getRandomValues(array)
            const secureRandom = Array.from(array, byte => byte.toString(36)).join('').substring(0, 8)
            room = `cypher-secure-${targetUserId || 'default'}-${timestamp}-${secureRandom}`
          }
          
          console.log('Creating cryptographically secure Jitsi room:', room)
          
          const options = {
            roomName: room,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainerRef.current,
            userInfo: {
              displayName: username
            },
            configOverwrite: {
              startWithAudioMuted: false,
              startWithVideoMuted: isAudioOnly,
              // Fix microphone blinking and conflicts
              disableAudioLevels: true,
              enableNoAudioDetection: false,
              enableNoisyMicDetection: false,
              enableTalkWhileMuted: false,
              // Audio processing settings to prevent conflicts
              disableAudioProcessing: false,
              stereo: true,
              enableLipSync: false,
              // Disable features that might cause mic issues
              disableRemoteMute: true,
              disableGrantModerator: true,
              disableKick: true,
              // Connection and performance settings
              disableSimulcast: false,
              enableLayerSuspension: true,
              disableSuspendVideo: true,
              // Security settings
              disableDeepLinking: true,
              disableInviteFunctions: true,
              disableThirdPartyRequests: true,
              enableWelcomePage: false,
              prejoinPageEnabled: false,
              requireDisplayName: false,
              enableUserRolesBasedOnToken: false,
              disableProfile: true,
              enableFeaturesBasedOnToken: false,
              disableSelfView: false,
              disableSelfViewSettings: true,
              enableClosePage: false,
              disablePrivateMessages: true,
              disableChat: true,
              enableLobbyChat: false,
              disableReactions: true,
              disablePolls: true,
              disableRaiseHand: true,
              disableRecording: true,
              disableLiveStreaming: true,
              disableBreakoutRooms: true,
              disableWhiteboard: true,
              disableSharedVideo: true,
              disableVirtualBackground: true,
              // Media settings
              enableAutomaticUrlCopy: false,
              enableSaveLogs: false,
              disableH264: false,
              preferH264: true,
              enableTcc: true,
              useStunTurn: true,
              enableP2P: true,
              p2p: {
                enabled: true,
                stunServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:stun1.l.google.com:19302' }
                ]
              },
              backToInCallBlue: true,
              suppressNotSupportedWarning: true,
              resolution: 720,
              constraints: {
                video: {
                  height: {
                    ideal: 720,
                    max: 720,
                    min: 180
                  },
                  width: {
                    ideal: 1280,
                    max: 1280,
                    min: 320
                  }
                },
                audio: {
                  // Enable audio processing for better quality
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                  sampleRate: 48000,
                  channelCount: 2,
                  // Add specific constraints to prevent mic conflicts
                  googEchoCancellation: true,
                  googAutoGainControl: true,
                  googNoiseSuppression: true,
                  googHighpassFilter: true,
                  googTypingNoiseDetection: true
                }
              }
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_BRAND_WATERMARK: false,
              SHOW_POWERED_BY: false,
              TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'profile', 'chat',
                'recording', 'livestreaming', 'etherpad', 'sharedvideo',
                'settings', 'raisehand', 'videoquality', 'filmstrip',
                'invite', 'feedback', 'stats', 'shortcuts',
                'tileview', 'videobackgroundblur', 'download', 'help',
                'mute-everyone', 'security'
              ],
              SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
              VERTICAL_FILMSTRIP: true,
              FILM_STRIP_MAX_HEIGHT: 120,
              DEFAULT_BACKGROUND: '#040404',
              DEFAULT_LOCAL_DISPLAY_NAME: 'Me',
              DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
              TOOLBAR_ALWAYS_VISIBLE: true,
              RECENT_LIST_ENABLED: false,
              OPTIMAL_BROWSERS: ['chrome', 'firefox', 'webkit'],
              UNSUPPORTED_BROWSERS: []
            }
          }

          const api = new (window as any).JitsiMeetExternalAPI(domain, options)
          
          // Add connection timeout
          const connectionTimeout = setTimeout(() => {
            if (isLoading) {
              console.error('Jitsi connection timeout')
              setIsLoading(false)
              setConnectionError('Connection timeout. Please check your internet connection and try again.')
            }
          }, 30000) // 30 second timeout
          
          api.addEventListeners({
            readyToClose: () => {
              console.log('Jitsi meeting ready to close')
              clearTimeout(connectionTimeout)
              onClose()
            },
            videoConferenceJoined: () => {
              console.log('Successfully joined Jitsi conference')
              clearTimeout(connectionTimeout)
              setIsLoading(false)
              
              // Get initial mute states - use the current API instance
              try {
                const audioMuted = api.isAudioMuted()
                const videoMuted = api.isVideoMuted()
                setIsAudioMuted(audioMuted)
                setIsVideoMuted(videoMuted)
                console.log('Initial mute states - Audio:', audioMuted, 'Video:', videoMuted)
              } catch (error) {
                console.warn('Could not get initial mute states:', error)
                // Set safe defaults
                setIsAudioMuted(false)
                setIsVideoMuted(isAudioOnly)
              }
            },
            videoConferenceLeft: () => {
              console.log('Left Jitsi conference')
              onClose()
            },
            participantJoined: (participant: any) => {
              console.log('Participant joined:', participant)
            },
            participantLeft: (participant: any) => {
              console.log('Participant left:', participant)
            },
            audioMuteStatusChanged: (data: any) => {
              console.log('Audio mute status changed:', data)
              setIsAudioMuted(data.muted)
            },
            videoMuteStatusChanged: (data: any) => {
              console.log('Video mute status changed:', data)
              setIsVideoMuted(data.muted)
            },
            screenSharingStatusChanged: (data: any) => {
              console.log('Screen sharing status changed:', data)
            },
            dominantSpeakerChanged: (data: any) => {
              console.log('Dominant speaker changed:', data)
            },
            errorOccurred: (error: any) => {
              console.error('Jitsi error occurred:', error)
            },
            connectionFailed: (error: any) => {
              console.error('Jitsi connection failed:', error)
              clearTimeout(connectionTimeout)
              setIsLoading(false)
              setConnectionError(`Connection failed: ${error.message || 'Please check your internet connection and try again.'}`)
            },
            connectionEstablished: () => {
              console.log('Jitsi connection established')
            },
            connectionDisconnected: () => {
              console.log('Jitsi connection disconnected')
            }
          })

          setJitsiApi(api)
        }
      } catch (error) {
        console.error('Error loading Jitsi:', error)
        setIsLoading(false)
        setConnectionError(`Failed to load video call: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    loadJitsi()

    return () => {
      if (jitsiApi) {
        console.log('Disposing Jitsi API')
        jitsiApi.dispose()
        setJitsiApi(null)
      }
    }
  }, [isOpen, roomName, targetUserId, username, isAudioOnly, onClose, sessionId])

  const handleEndCall = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('hangup')
    }
    onClose()
  }

  const handleToggleAudio = async () => {
    if (jitsiApi) {
      try {
        await jitsiApi.executeCommand('toggleAudio')
        // Update state after command execution
        setTimeout(() => {
          const newAudioState = jitsiApi.isAudioMuted()
          setIsAudioMuted(newAudioState)
        }, 100)
      } catch (error) {
        console.error('Failed to toggle audio:', error)
      }
    }
  }

  const handleToggleVideo = async () => {
    if (jitsiApi) {
      try {
        await jitsiApi.executeCommand('toggleVideo')
        // Update state after command execution
        setTimeout(() => {
          const newVideoState = jitsiApi.isVideoMuted()
          setIsVideoMuted(newVideoState)
        }, 100)
      } catch (error) {
        console.error('Failed to toggle video:', error)
      }
    }
  }

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 ${isMinimized ? 'bg-transparent' : 'bg-black/80'} flex items-center justify-center`}>
      <Card className={`${isMinimized ? 'w-80 h-60' : 'w-full max-w-6xl h-full max-h-[90vh]'} flex flex-col`}>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {isAudioOnly ? <Phone className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            {isAudioOnly ? 'Audio Call' : 'Video Call'}
            {isGroupCall && <Users className="w-4 h-4 ml-1" />}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMinimize}
              className="h-8 w-8"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEndCall}
              className="h-8 w-8 text-red-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Loading Jitsi Meet...</p>
              </div>
            </div>
          )}
          
          {connectionError && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-center text-white p-6 bg-red-900/80 rounded-lg backdrop-blur-sm">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                <p className="text-red-200 mb-4">{connectionError}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="text-white border-white/50 hover:bg-white/10"
                >
                  Retry Connection
                </Button>
              </div>
            </div>
          )}
          
          <div 
            ref={jitsiContainerRef} 
            className="w-full h-full"
            style={{ minHeight: isMinimized ? '200px' : '400px' }}
          />
        </CardContent>

        {!isMinimized && (
          <div className="flex items-center justify-center gap-4 p-4 bg-background border-t">
            <Button
              onClick={handleToggleAudio}
              variant={isAudioMuted ? "destructive" : "outline"}
              size="icon"
              className="w-12 h-12 rounded-full"
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            <Button
              onClick={handleToggleVideo}
              variant={isVideoMuted ? "destructive" : "outline"}
              size="icon"
              className="w-12 h-12 rounded-full"
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>
            
            <Button
              onClick={handleEndCall}
              variant="destructive"
              size="icon"
              className="w-12 h-12 rounded-full"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}