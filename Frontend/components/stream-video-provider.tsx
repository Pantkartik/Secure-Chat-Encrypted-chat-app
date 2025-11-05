"use client"

import React, { useMemo } from 'react';
import { StreamVideo, StreamTheme, StreamVideoClient } from '@stream-io/video-react-sdk';

interface StreamVideoProviderProps {
  children: React.ReactNode;
  apiKey: string;
  token: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

export function StreamVideoProvider({ children, apiKey, token, user }: StreamVideoProviderProps) {
  const client = useMemo(() => {
    return StreamVideoClient.getOrCreateInstance({
      apiKey,
      token,
      user,
    });
  }, [apiKey, token, user]);

  return (
    <StreamVideo client={client}>
      <StreamTheme>
        {children}
      </StreamTheme>
    </StreamVideo>
  );
}