'use client';

import React, { useState, useEffect } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
  ParticipantView,
  CallParticipantsList,
  PaginatedGridLayout,
} from '@stream-io/video-react-sdk';
import { Loader2, Video, PhoneOff, Users, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StreamVideoCallProps {
  apiKey: string;
  token: string;
  userId: string;
  userName: string;
  callId: string;
  callType?: 'default' | 'audio_room' | 'livestream';
  onCallEnd?: () => void;
  theme?: 'light' | 'dark';
}

const StreamVideoCall: React.FC<StreamVideoCallProps> = ({
  apiKey,
  token,
  userId,
  userName,
  callId,
  callType = 'default',
  onCallEnd,
  theme = 'dark'
}) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'speaker' | 'grid'>('speaker');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const initStreamClient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate required parameters
        if (!apiKey || !token || !userId || !userName || !callId) {
          throw new Error('Missing required parameters for Stream Video client initialization');
        }

        // Validate token format
        if (token === 'fallback-token' || token.length < 10) {
          throw new Error('Invalid Stream Video token format. Please ensure proper token generation.');
        }

        console.log('Initializing Stream Video client with:', { apiKey, userId, userName, callId, callType });

        // Initialize Stream Video client with enhanced configuration
        const streamClient = new StreamVideoClient({
          apiKey,
          token,
          user: {
            id: userId,
            name: userName,
          },
          options: {
            enableWSFallback: true,
            retryInterval: 1000,
            maxRetryAttempts: 3,
            timeout: 30000,
          },
        });

        setClient(streamClient);

        // Create or join call with retry logic
        const callInstance = streamClient.call(callType, callId);
        
        // Add connection event listeners
        callInstance.on('connection.error', (error) => {
          console.error('Stream Video connection error:', error);
          setError(`Connection error: ${error.message}`);
        });

        callInstance.on('connection.recovered', () => {
          console.log('Stream Video connection recovered');
          setError(null);
        });

        // Join the call with enhanced error handling
        await callInstance.join({ 
          create: true,
          timeout: 30000, // 30 second timeout
        });

        setCall(callInstance);
        setIsLoading(false);
        console.log('Successfully joined Stream Video call:', callId);
      } catch (err) {
        console.error('Error initializing Stream Video client:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize video call';
        
        // Enhanced error messages for common issues
        if (errorMessage.includes('token')) {
          setError('Authentication failed: Invalid or expired token. Please refresh and try again.');
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          setError('Network error: Unable to connect to video service. Please check your internet connection.');
        } else if (errorMessage.includes('timeout')) {
          setError('Connection timeout: The video service is taking too long to respond. Please try again.');
        } else {
          setError(errorMessage);
        }
        
        setIsLoading(false);
      }
    };

    if (apiKey && token && userId && callId) {
      initStreamClient();
    } else {
      setError('Missing required configuration parameters');
      setIsLoading(false);
    }

    return () => {
      if (call) {
        call.leave().catch(console.error);
      }
      if (client) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, [apiKey, token, userId, userName, callId, callType]);

  const handleCallEnd = () => {
    if (call) {
      call.leave();
    }
    if (client) {
      client.disconnectUser();
    }
    onCallEnd?.();
  };

  const toggleLayout = () => {
    setLayout(layout === 'speaker' ? 'grid' : 'speaker');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
        <div className="text-center z-10">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-blue-400 mx-auto mb-6" />
            <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full animate-pulse" />
          </div>
          <p className="text-white text-xl font-medium mb-2">Initializing video call...</p>
          <p className="text-slate-400 text-sm">Setting up secure connection</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1),transparent_50%)] pointer-events-none" />
        <Card className="p-8 bg-red-900/20 border-red-500/50 backdrop-blur-lg shadow-2xl rounded-2xl border-2 max-w-md">
          <div className="text-center">
            <div className="relative mx-auto mb-6">
              <Video className="w-20 h-20 text-red-400 mx-auto" />
              <div className="absolute inset-0 bg-red-400/20 blur-xl rounded-full" />
            </div>
            <h3 className="text-white text-2xl font-bold mb-3 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Video Call Error
            </h3>
            <p className="text-red-300 mb-6 text-lg">{error}</p>
            
            {/* Error-specific guidance */}
            {error.includes('token') && (
              <div className="mb-4 p-4 bg-red-900/30 rounded-lg border border-red-500/30">
                <p className="text-red-200 text-sm">
                  <strong>Solution:</strong> Try refreshing the page or logging out and back in to get a new authentication token.
                </p>
              </div>
            )}
            
            {error.includes('network') && (
              <div className="mb-4 p-4 bg-red-900/30 rounded-lg border border-red-500/30">
                <p className="text-red-200 text-sm">
                  <strong>Solution:</strong> Check your internet connection and ensure the backend server is running on port 3001.
                </p>
              </div>
            )}
            
            {error.includes('timeout') && (
              <div className="mb-4 p-4 bg-red-900/30 rounded-lg border border-red-500/30">
                <p className="text-red-200 text-sm">
                  <strong>Solution:</strong> The video service may be experiencing high load. Please try again in a few moments.
                </p>
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="border-red-500 text-red-300 hover:bg-red-900/20 hover:text-red-200"
              >
                Retry
              </Button>
              <Button onClick={onCallEnd} variant="destructive" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl">
                <PhoneOff className="w-5 h-5 mr-2" />
                Close Call
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!client || !call) {
    return null;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme>
          <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.1),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border-green-500/40 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    Live
                  </Badge>
                  <h3 className="text-white font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Video Call: {callId}
                  </h3>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleLayout}
                    className="text-white hover:bg-white/10 rounded-full transition-all duration-200 transform hover:scale-110"
                    title={layout === 'speaker' ? 'Switch to Grid View' : 'Switch to Speaker View'}
                  >
                    {layout === 'speaker' ? <Users className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowParticipants(!showParticipants)}
                    className="text-white hover:bg-white/10 rounded-full transition-all duration-200 transform hover:scale-110"
                    title="Show Participants"
                  >
                    <Users className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowChat(!showChat)}
                    className="text-white hover:bg-white/10 rounded-full transition-all duration-200 transform hover:scale-110"
                    title="Show Chat"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    onClick={handleCallEnd}
                    variant="destructive"
                    size="sm"
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    End Call
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Video Area */}
            <div className="h-full pt-16">
              <div className="h-full relative">
                {layout === 'speaker' ? (
                  <SpeakerLayout participantsBarPosition="bottom" />
                ) : (
                  <PaginatedGridLayout />
                )}
                
                {/* Participants Panel */}
                {showParticipants && (
                  <div className="absolute right-4 top-4 bottom-20 w-80 bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-white font-semibold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Participants
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowParticipants(false)}
                        className="text-white hover:bg-white/10 rounded-full transition-all duration-200"
                      >
                        ×
                      </Button>
                    </div>
                    <CallParticipantsList onClose={() => setShowParticipants(false)} />
                  </div>
                )}
                
                {/* Chat Panel */}
                {showChat && (
                  <div className="absolute right-4 top-4 bottom-20 w-80 bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-white font-semibold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Chat
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowChat(false)}
                        className="text-white hover:bg-white/10 rounded-full transition-all duration-200"
                      >
                        ×
                      </Button>
                    </div>
                    {/* Chat component would be integrated here */}
                    <div className="text-slate-300 text-sm bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <span className="font-medium">Chat Integration</span>
                      </div>
                      <p className="text-slate-400">Secure chat functionality coming soon...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-slate-900/90 via-slate-800/90 to-transparent backdrop-blur-lg border-t border-white/10 p-6">
              <div className="flex items-center justify-center">
                <CallControls />
              </div>
            </div>
          </div>
        </StreamTheme>
      </StreamCall>
    </StreamVideo>
  );
};

export default StreamVideoCall;