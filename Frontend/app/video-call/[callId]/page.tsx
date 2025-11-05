'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StreamVideoCall from '@/components/stream-video-call';
import { useStreamVideo } from '@/hooks/useStreamVideo';
import { Loader2, Video, PhoneOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VideoCallPageProps {
  searchParams: {
    sessionId?: string;
    userName?: string;
    callName?: string;
    callType?: string;
  };
}

const VideoCallPage: React.FC<VideoCallPageProps> = ({ searchParams }) => {
  const params = useParams();
  const router = useRouter();
  const callId = params.callId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  
  const { config, generateToken } = useStreamVideo();

  useEffect(() => {
    const initializeCall = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user information from search params or generate defaults
        const currentUserName = searchParams.userName || `User-${Math.random().toString(36).substr(2, 9)}`;
        const currentUserId = searchParams.userName || currentUserName;
        
        setUserId(currentUserId);
        setUserName(currentUserName);

        // Generate Stream token
        await generateToken(currentUserId, currentUserName);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing video call:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize video call');
        setIsLoading(false);
      }
    };

    if (callId) {
      initializeCall();
    } else {
      setError('Invalid call ID');
      setIsLoading(false);
    }
  }, [callId, searchParams, generateToken]);

  const handleCallEnd = () => {
    // Navigate back to the previous page or dashboard
    if (searchParams.sessionId) {
      router.push(`/auth/chat/${searchParams.sessionId}`);
    } else {
      router.push('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Joining Video Call</h2>
          <p className="text-slate-300">Initializing your video call experience...</p>
          
          <Card className="mt-6 p-4 bg-slate-800/50 border-slate-700 backdrop-blur-lg">
            <div className="text-center">
              <Badge variant="secondary" className="mb-2 bg-blue-500/20 text-blue-300">
                Call ID
              </Badge>
              <p className="text-white font-mono text-sm">{callId}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="p-8 bg-red-900/20 border-red-500/50 backdrop-blur-lg max-w-md">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Video Call Error</h2>
            <p className="text-red-300 mb-6">{error}</p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full border-red-500 text-red-300 hover:bg-red-500/10"
              >
                Try Again
              </Button>
              
              <Button 
                onClick={handleCallEnd} 
                variant="destructive"
                className="w-full"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                Leave Call
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-lg">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Connection Issue</h2>
            <p className="text-slate-300 mb-6">Unable to establish video call connection.</p>
            
            <Button 
              onClick={handleCallEnd} 
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Return to Chat
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <StreamVideoCall
      apiKey={config.apiKey}
      token={config.token}
      userId={userId}
      userName={userName}
      callId={callId}
      callType={searchParams.callType as 'default' | 'audio_room' | 'livestream' || 'default'}
      onCallEnd={handleCallEnd}
      theme="dark"
    />
  );
};

export default VideoCallPage;