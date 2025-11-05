"use client"

import { useState, useEffect } from 'react'
import { useStreamVideo } from '@/hooks/useStreamVideo'
import { StreamVideoProvider } from '@/components/stream-video-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Phone, PhoneOff } from 'lucide-react'

function StreamVideoTest() {
  const { config, isLoading: hookLoading, error, generateToken, createCall, endCall } = useStreamVideo()
  const [testCallId, setTestCallId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamToken, setStreamToken] = useState('')

  useEffect(() => {
    // Fetch Stream Video token
    const fetchStreamToken = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: 'test-user',
            userName: 'Test User' 
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          setStreamToken(data.token)
        } else {
          console.error('Failed to fetch Stream Video token')
        }
      } catch (error) {
        console.error('Error fetching Stream Video token:', error)
      }
    }
    
    fetchStreamToken()
  }, [])

  const handleStartCall = async () => {
    setIsLoading(true)
    try {
      const callId = `test-call-${Date.now()}`
      const callName = `Test Call ${callId}`
      setTestCallId(callId)
      await generateToken('test-user', 'Test User')
      await createCall(callId, callName, ['test-user'])
    } catch (error) {
      console.error('Error starting call:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinCall = async () => {
    if (!testCallId) return
    setIsLoading(true)
    try {
      await generateToken('test-user', 'Test User')
      // For joining, we just need to generate the token, the StreamVideoProvider will handle the rest
    } catch (error) {
      console.error('Error joining call:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndCall = async () => {
    setIsLoading(true)
    try {
      await endCall()
      setTestCallId('')
    } catch (error) {
      console.error('Error ending call:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!streamToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center animate-pulse">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Loading Stream Video...</h3>
          <p className="text-sm text-muted-foreground">Please wait while we initialize your video connection</p>
        </div>
      </div>
    )
  }

  return (
    <StreamVideoProvider 
      apiKey={process.env.NEXT_PUBLIC_STREAM_API_KEY!} 
      token={streamToken}
      user={{
        id: 'test-user',
        name: 'Test User',
        image: 'https://getstream.io/random_svg/?name=Test+User',
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 border-slate-200/60 dark:border-slate-700/60 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Stream Video Integration Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleStartCall}
                  disabled={isLoading || !!config}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Start Test Call
                </Button>
                
                <Button
                  onClick={handleJoinCall}
                  disabled={isLoading || !testCallId || !!config}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Join Call
                </Button>
                
                <Button
                  onClick={handleEndCall}
                  disabled={isLoading || !config}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/30 border border-slate-200/50 dark:border-slate-700/50">
                  <h3 className="font-semibold text-foreground mb-2">Current Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Config Status:</span>
                      <span className={`font-medium ${config ? 'text-emerald-600' : 'text-red-600'}`}>
                        {config ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loading Status:</span>
                      <span className={`font-medium ${hookLoading ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {hookLoading ? 'Loading' : 'Ready'}
                      </span>
                    </div>
                    {testCallId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Call ID:</span>
                        <span className="font-medium text-blue-600">{testCallId}</span>
                      </div>
                    )}
                    {error && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Error:</span>
                        <span className="font-medium text-red-600">{error}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {config && testCallId && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200/50 dark:border-emerald-700/50">
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Call Active!</h3>
                    <p className="text-sm text-emerald-600 dark:text-emerald-300">
                      Your video call is now active. You can invite others to join using the call ID: <strong>{testCallId}</strong>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StreamVideoProvider>
  )
}

export default function StreamVideoTestPage() {
  return <StreamVideoTest />
}