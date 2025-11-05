import { useState, useEffect, useCallback } from 'react';

interface StreamVideoConfig {
  apiKey: string;
  token: string;
  userId: string;
  userName: string;
}

interface UseStreamVideoReturn {
  config: StreamVideoConfig | null;
  isLoading: boolean;
  error: string | null;
  generateToken: (userId: string, userName: string) => Promise<void>;
  createCall: (callId: string, callName: string, memberIds?: string[]) => Promise<void>;
  endCall: () => void;
}

export const useStreamVideo = (): UseStreamVideoReturn => {
  const [config, setConfig] = useState<StreamVideoConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

  const generateToken = useCallback(async (userId: string, userName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/stream/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Stream token');
      }

      const data = await response.json();

      if (data.success) {
        setConfig({
          apiKey: data.apiKey,
          token: data.token,
          userId,
          userName,
        });
      } else {
        throw new Error(data.error || 'Failed to generate token');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error generating Stream token:', err);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  const createCall = useCallback(async (callId: string, callName: string, memberIds: string[] = []) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/stream/channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: callId,
          channelName: callName,
          memberIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create video call channel');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create call');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error creating video call:', err);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  const endCall = useCallback(() => {
    setConfig(null);
    setError(null);
  }, []);

  return {
    config,
    isLoading,
    error,
    generateToken,
    createCall,
    endCall,
  };
};