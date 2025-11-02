"use client"

import { useState } from "react"
import { Video, Phone, Users } from "lucide-react"
import VideoCall from "./video-call"

interface MultiUserVideoExampleProps {
  sessionId: string
  username: string
  socket: any
}

export default function MultiUserVideoExample({ sessionId, username, socket }: MultiUserVideoExampleProps) {
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)
  const [isAudioOnly, setIsAudioOnly] = useState(false)
  const [isGroupCall, setIsGroupCall] = useState(false)
  const [targetUserId, setTargetUserId] = useState<string>("")

  const startIndividualCall = (audioOnly = false) => {
    setIsAudioOnly(audioOnly)
    setIsGroupCall(false)
    setIsVideoCallOpen(true)
  }

  const startGroupCall = (audioOnly = false) => {
    setIsAudioOnly(audioOnly)
    setIsGroupCall(true)
    setIsVideoCallOpen(true)
  }

  const startCallWithUser = (audioOnly = false) => {
    if (!targetUserId.trim()) {
      alert("Please enter a target user ID")
      return
    }
    setIsAudioOnly(audioOnly)
    setIsGroupCall(false)
    setIsVideoCallOpen(true)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Multi-User Video Call Demo</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Individual Calls */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Individual Calls
          </h2>
          <p className="text-gray-600 mb-4">One-on-one video or audio calls</p>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter user ID to call"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => startCallWithUser(false)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                Video Call
              </button>
              <button
                onClick={() => startCallWithUser(true)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Audio Call
              </button>
            </div>
          </div>
        </div>

        {/* Group Calls */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Calls
          </h2>
          <p className="text-gray-600 mb-4">Multi-user video conferences (up to 4 participants)</p>
          
          <div className="space-y-3">
            <button
              onClick={() => startGroupCall(false)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Start Group Video Call
            </button>
            
            <button
              onClick={() => startGroupCall(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Start Group Audio Call
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => startIndividualCall(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md flex flex-col items-center gap-2"
            >
              <Video className="w-6 h-6" />
              <span>Video Call</span>
            </button>
            
            <button
              onClick={() => startIndividualCall(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-md flex flex-col items-center gap-2"
            >
              <Phone className="w-6 h-6" />
              <span>Audio Call</span>
            </button>
            
            <button
              onClick={() => startGroupCall(false)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-md flex flex-col items-center gap-2"
            >
              <Users className="w-6 h-6" />
              <span>Group Video</span>
            </button>
            
            <button
              onClick={() => startGroupCall(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-md flex flex-col items-center gap-2"
            >
              <Users className="w-6 h-6" />
              <span>Group Audio</span>
            </button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-gray-50 rounded-lg p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-3">How to Use Multi-User Video Calls</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Individual Calls:</strong> Enter a specific user ID and click "Video Call" or "Audio Call"</p>
            <p><strong>Group Calls:</strong> Click "Start Group Video Call" or "Start Group Audio Call" to create a room</p>
            <p><strong>Joining:</strong> Other users can join your group call by using the same session ID</p>
            <p><strong>Features:</strong> Toggle video/audio, minimize/maximize, and proper cleanup on hangup</p>
            <p><strong>Limit:</strong> Up to 4 participants per group call</p>
          </div>
        </div>
      </div>

      {/* Video Call Component */}
      {isVideoCallOpen && (
        <VideoCall
          isOpen={isVideoCallOpen}
          onClose={() => setIsVideoCallOpen(false)}
          sessionId={sessionId}
          username={username}
          socket={socket}
          targetUserId={targetUserId || undefined}
          isGroupCall={isGroupCall}
          isAudioOnly={isAudioOnly}
        />
      )}
    </div>
  )
}