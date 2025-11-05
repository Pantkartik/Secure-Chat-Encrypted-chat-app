"use client"

import { useState, useEffect } from "react"
import { io } from "socket.io-client"

export default function TestConnection() {
  const [status, setStatus] = useState<string>("Not connected")
  const [logs, setLogs] = useState<string[]>([])
  const [sessionId, setSessionId] = useState<string>("TEST123")
  const [username, setUsername] = useState<string>("testuser")

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    try {
      setStatus("Testing connection...")
      addLog("Starting connection test")

      // Test 1: Check if backend is reachable
      const healthResponse = await fetch("http://localhost:3001/health")
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        addLog(`✅ Health check passed: ${JSON.stringify(healthData)}`)
      } else {
        addLog(`❌ Health check failed: ${healthResponse.status}`)
      }

      // Test 2: Create a session
      const createResponse = await fetch("http://localhost:3001/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      if (createResponse.ok) {
        const sessionData = await createResponse.json()
        setSessionId(sessionData.sessionId)
        addLog(`✅ Session created: ${sessionData.sessionId}`)
      } else {
        addLog(`❌ Session creation failed: ${createResponse.status}`)
      }

      // Test 3: Socket.IO connection
      const socket = io("http://localhost:3001")
      
      socket.on("connect", () => {
        setStatus("Connected to Socket.IO")
        addLog(`✅ Socket connected: ${socket.id}`)
        
        // Test 4: Join session
        socket.emit("joinSession", { sessionId, username })
        addLog(`📤 Sent joinSession: ${sessionId} as ${username}`)
      })

      socket.on("connect_error", (error) => {
        setStatus("Connection failed")
        addLog(`❌ Socket connection error: ${error.message}`)
      })

      socket.on("disconnect", (reason) => {
        setStatus("Disconnected")
        addLog(`🔌 Socket disconnected: ${reason}`)
      })

      socket.on("usersList", (users) => {
        addLog(`✅ Received usersList: ${JSON.stringify(users)}`)
      })

      socket.on("userJoined", (user) => {
        addLog(`👤 User joined: ${JSON.stringify(user)}`)
      })

      socket.on("userLeft", (user) => {
        addLog(`👋 User left: ${JSON.stringify(user)}`)
      })

      socket.on("userCountUpdate", (count) => {
        addLog(`👥 User count: ${count}`)
      })

      socket.on("receiveMessage", (message) => {
        addLog(`💬 Message received: ${JSON.stringify(message)}`)
      })

      // Test 5: Send a message after a delay
      setTimeout(() => {
        if (socket.connected) {
          socket.emit("sendMessage", {
            sessionId,
            username,
            message: "Hello from test!"
          })
          addLog("📤 Sent test message")
        }
      }, 2000)

      // Clean up after 10 seconds
      setTimeout(() => {
        socket.disconnect()
        addLog("🔌 Socket disconnected by test")
        setStatus("Test completed")
      }, 10000)

    } catch (error) {
      setStatus("Test failed")
      addLog(`💥 Test error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Connection Test</h1>
        
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Session ID</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Enter session ID"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Enter username"
            />
          </div>
          
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start Connection Test
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Status: {status}</h2>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Logs:</h2>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}