'use client'

import React, { useState, useEffect } from 'react'
import { SocketProvider, useSocket } from '../../../contexts/SocketContext'
import SimplePeerVideoCallImproved from '../../../components/simple-peer-video-call-improved'

export default function VideoCallTestPage() {
  return (
    <SocketProvider>
      <VideoCallTestContent />
    </SocketProvider>
  )
}

function VideoCallTestContent() {
  const { socket, sessionId, username } = useSocket()
  const [isConnected, setIsConnected] = useState(false)
  const [testRoomId, setTestRoomId] = useState('test-room-123')
  const [targetUserId, setTargetUserId] = useState('')
  const [callMode, setCallMode] = useState<'individual' | 'group'>('individual')
  const [isAudioOnly, setIsAudioOnly] = useState(false)

  useEffect(() => {
    if (socket) {
      setIsConnected(true)
      console.log('Socket connected:', sessionId)
    } else {
      setIsConnected(false)
    }
  }, [socket, sessionId])

  const handleCallEnd = () => {
    console.log('Call ended')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Video Call Test</h1>
          
          {/* Connection Status */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Session ID: {sessionId || 'Not available'}</p>
            <p className="text-sm text-gray-600">Username: {username || 'Not available'}</p>
          </div>

          {/* Test Configuration */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Test Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Mode</label>
                <select 
                  value={callMode} 
                  onChange={(e) => setCallMode(e.target.value as 'individual' | 'group')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="individual">Individual Call</option>
                  <option value="group">Group Call</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audio Only</label>
                <select 
                  value={isAudioOnly.toString()} 
                  onChange={(e) => setIsAudioOnly(e.target.value === 'true')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="false">Video + Audio</option>
                  <option value="true">Audio Only</option>
                </select>
              </div>
            </div>

            {callMode === 'group' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
                <input
                  type="text"
                  value={testRoomId}
                  onChange={(e) => setTestRoomId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter room ID"
                />
              </div>
            )}

            {callMode === 'individual' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target User ID</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter target user ID"
                />
              </div>
            )}
          </div>

          {/* Video Call Component */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Video Call Test</h2>
            {isConnected ? (
              <SimplePeerVideoCallImproved
                roomId={callMode === 'group' ? testRoomId : undefined}
                isGroupCall={callMode === 'group'}
                targetUserId={callMode === 'individual' ? targetUserId : undefined}
                isAudioOnly={isAudioOnly}
                onCallEnd={handleCallEnd}
              />
            ) : (
              <div className="p-8 bg-gray-100 rounded-lg text-center">
                <p className="text-gray-600">Connecting to server...</p>
              </div>
            )}
          </div>

          {/* Test Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-blue-800">Test Instructions</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Make sure your camera and microphone are enabled</li>
              <li>• For individual calls: Enter a target user ID and start the call</li>
              <li>• For group calls: Use the room ID to join/create a room</li>
              <li>• Test audio/video toggles and end call functionality</li>
              <li>• Check browser console for detailed logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}