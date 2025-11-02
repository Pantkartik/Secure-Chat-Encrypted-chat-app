'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  sessionId: string | null
  username: string | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  sessionId: null,
  username: null,
  isConnected: false
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Create socket connection
    const newSocket = io('http://localhost:3002', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
      setSessionId(newSocket.id || null)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('session-created', (data) => {
      console.log('Session created:', data)
      setSessionId(data.sessionId)
      setUsername(data.username || 'Anonymous')
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, sessionId, username, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}