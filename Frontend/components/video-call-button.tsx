'use client';

import React, { useState } from 'react';
import { Video, Phone, PhoneOff, Users, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import StreamVideoCall from './stream-video-call';
import { useStreamVideo } from '@/hooks/useStreamVideo';

interface VideoCallButtonProps {
  currentUser: {
    id: string;
    name: string;
  };
  targetUsers?: Array<{
    id: string;
    name: string;
  }>;
  sessionId?: string;
  isPrivate?: boolean;
  onCallStart?: (callId: string) => void;
  onCallEnd?: () => void;
}

const VideoCallButton: React.FC<VideoCallButtonProps> = ({
  currentUser,
  targetUsers = [],
  sessionId,
  isPrivate = false,
  onCallStart,
  onCallEnd,
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [callId, setCallId] = useState<string>('');
  const [callName, setCallName] = useState<string>('');
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [isGroupCall, setIsGroupCall] = useState(false);
  const { toast } = useToast();
  const { config, isLoading, error, generateToken, createCall, endCall } = useStreamVideo();

  const generateCallId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `call-${timestamp}-${random}`;
  };

  const handleStartCall = async () => {
    try {
      const newCallId = generateCallId();
      const newCallName = callName || (isPrivate 
        ? `Private call with ${targetUsers.map(u => u.name).join(', ')}`
        : `Group call - ${sessionId}`
      );

      // Generate Stream token for current user
      await generateToken(currentUser.id, currentUser.name);
      
      // Create video call channel
      const memberIds = [currentUser.id, ...targetUsers.map(u => u.id)];
      await createCall(newCallId, newCallName, memberIds);

      setCallId(newCallId);
      setCallName(newCallName);
      setIsCallActive(true);
      onCallStart?.(newCallId);

      toast({
        title: 'Call Started',
        description: `Video call ${isAudioOnly ? '(Audio Only)' : ''} has been initiated.`,
        duration: 3000,
      });
    } catch (err) {
      console.error('Error starting call:', err);
      toast({
        title: 'Call Failed',
        description: error || 'Failed to start video call',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallId('');
    setCallName('');
    endCall();
    onCallEnd?.();

    toast({
      title: 'Call Ended',
      description: 'The video call has been ended.',
      duration: 3000,
    });
  };

  const handleJoinCall = async (joinCallId: string) => {
    try {
      // Generate Stream token for current user
      await generateToken(currentUser.id, currentUser.name);
      
      setCallId(joinCallId);
      setIsCallActive(true);
      onCallStart?.(joinCallId);

      toast({
        title: 'Joining Call',
        description: 'Connecting to the video call...',
        duration: 3000,
      });
    } catch (err) {
      console.error('Error joining call:', err);
      toast({
        title: 'Join Failed',
        description: error || 'Failed to join video call',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  if (isCallActive && config) {
    return (
      <StreamVideoCall
        apiKey={config.apiKey}
        token={config.token}
        userId={config.userId}
        userName={config.userName}
        callId={callId}
        callType={isAudioOnly ? 'audio_room' : 'default'}
        onCallEnd={handleEndCall}
      />
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Quick Call Button */}
      <Button
        onClick={handleStartCall}
        disabled={isLoading}
        variant="default"
        size="sm"
        className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 rounded-full px-4 py-2"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Video className="w-4 h-4" />
        )}
        <span className="ml-2 font-medium">
          {isPrivate ? 'Private Call' : 'Group Call'}
        </span>
      </Button>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-slate-700 text-white backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Video Call Settings
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Configure your video call preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="callName">Call Name</Label>
              <Input
                id="callName"
                value={callName}
                onChange={(e) => setCallName(e.target.value)}
                placeholder="Enter call name..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200">
              <Label htmlFor="audioOnly" className="text-slate-200">Audio Only</Label>
              <Switch
                id="audioOnly"
                checked={isAudioOnly}
                onCheckedChange={setIsAudioOnly}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
              />
            </div>

            {targetUsers.length > 1 && (
              <div className="flex items-center justify-between">
                <Label htmlFor="groupCall">Group Call</Label>
                <Switch
                  id="groupCall"
                  checked={isGroupCall}
                  onCheckedChange={setIsGroupCall}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Participants</Label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{currentUser.name} (You)</span>
                </div>
                {targetUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowSettings(false);
                handleStartCall();
              }}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? 'Starting...' : 'Start Call'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Call Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-all duration-200"
          >
            <Phone className="w-4 h-4 mr-2" />
            Join Call
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-slate-700 text-white backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Join Video Call
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Enter the call ID to join an existing video call
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="joinCallId">Call ID</Label>
              <Input
                id="joinCallId"
                placeholder="Enter call ID..."
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const callId = (e.target as HTMLInputElement).value;
                    if (callId.trim()) {
                      handleJoinCall(callId.trim());
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                const input = document.getElementById('joinCallId') as HTMLInputElement;
                if (input?.value.trim()) {
                  handleJoinCall(input.value.trim());
                }
              }}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? 'Joining...' : 'Join Call'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {error && (
        <Badge variant="destructive" className="ml-2">
          {error}
        </Badge>
      )}
    </div>
  );
};

export default VideoCallButton;