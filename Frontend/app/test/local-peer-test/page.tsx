'use client'

import { useState, useRef, useEffect } from 'react'

/**
 * Local Simple Peer test - tests peer connection locally without server
 * This creates two peer connections that connect to each other locally
 */
export default function LocalSimplePeerTest() {
  const [isTesting, setIsTesting] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [dataChannelStatus, setDataChannelStatus] = useState('Closed')
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const peer1Ref = useRef<any>(null)
  const peer2Ref = useRef<any>(null)

  const startLocalTest = async () => {
    setError(null)
    setIsTesting(true)

    try {
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      streamRef.current = stream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      setHasPermission(true)

      // Create Simple Peer instances - load dynamically
      let Peer: any
      try {
        const SimplePeerModule = await import('simple-peer')
        Peer = SimplePeerModule.default
      } catch (importError) {
        console.error('Failed to load SimplePeer:', importError)
        setError('Failed to load SimplePeer library. Please make sure it\'s installed.')
        setIsTesting(false)
        return
      }

      if (!Peer) {
        setError('SimplePeer library not available')
        setIsTesting(false)
        return
      }

      // Create initiator peer (Peer 1)
      peer1Ref.current = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      })

      // Create responder peer (Peer 2)
      peer2Ref.current = new Peer({
        initiator: false,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      })

      // Set up peer 1 events
      peer1Ref.current.on('signal', (data: any) => {
        console.log('Peer 1 signal:', data)
        // Send signal to peer 2
        if (peer2Ref.current && !peer2Ref.current.destroyed) {
          peer2Ref.current.signal(data)
        }
      })

      peer1Ref.current.on('connect', () => {
        console.log('Peer 1 connected')
        setConnectionStatus('Connected (Peer 1)')
      })

      peer1Ref.current.on('data', (data: any) => {
        console.log('Peer 1 received data:', data.toString())
      })

      peer1Ref.current.on('error', (err: any) => {
        console.error('Peer 1 error:', err)
        setError(`Peer 1 error: ${err.message}`)
      })

      // Set up peer 2 events
      peer2Ref.current.on('signal', (data: any) => {
        console.log('Peer 2 signal:', data)
        // Send signal to peer 1
        if (peer1Ref.current && !peer1Ref.current.destroyed) {
          peer1Ref.current.signal(data)
        }
      })

      peer2Ref.current.on('connect', () => {
        console.log('Peer 2 connected')
        setConnectionStatus('Connected (Peer 2)')
        
        // Test data channel
        if (peer1Ref.current && !peer1Ref.current.destroyed) {
          peer1Ref.current.send('Hello from Peer 1!')
        }
        if (peer2Ref.current && !peer2Ref.current.destroyed) {
          peer2Ref.current.send('Hello from Peer 2!')
        }
      })

      peer2Ref.current.on('stream', (stream: MediaStream) => {
        console.log('Peer 2 received stream')
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
        }
      })

      peer2Ref.current.on('data', (data: any) => {
        console.log('Peer 2 received data:', data.toString())
        setDataChannelStatus('Data received')
      })

      peer2Ref.current.on('error', (err: any) => {
        console.error('Peer 2 error:', err)
        setError(`Peer 2 error: ${err.message}`)
      })

      // Start connection
      setConnectionStatus('Connecting...')
      
    } catch (err) {
      console.error('Error starting local test:', err)
      setError(err instanceof Error ? err.message : 'Failed to start local test')
      setIsTesting(false)
    }
  }

  const stopLocalTest = () => {
    // Clean up peers
    if (peer1Ref.current) {
      peer1Ref.current.destroy()
      peer1Ref.current = null
    }
    
    if (peer2Ref.current) {
      peer2Ref.current.destroy()
      peer2Ref.current = null
    }

    // Clean up stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }

    // Clean up video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    setIsTesting(false)
    setHasPermission(false)
    setConnectionStatus('Disconnected')
    setDataChannelStatus('Closed')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔄 Local Simple Peer Test</h1>
      
      {/* Status */}
      <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus.includes('Connected') ? 'bg-green-500' : 
              connectionStatus.includes('Connecting') ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span>Peer Connection: {connectionStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              dataChannelStatus === 'Data received' ? 'bg-green-500' : 
              dataChannelStatus === 'Closed' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span>Data Channel: {dataChannelStatus}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4">Controls</h2>
        <div className="flex gap-4">
          {!isTesting ? (
            <button
              onClick={startLocalTest}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Local Test
            </button>
          ) : (
            <button
              onClick={stopLocalTest}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Stop Test
            </button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Video */}
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2">Local Stream (Peer 1)</h3>
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg bg-black"
              style={{ aspectRatio: '16/9' }}
            />
            {!isTesting && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">📹</div>
                  <p className="text-white text-sm">Local Stream</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remote Video */}
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2">Remote Stream (Peer 2)</h3>
          <div className="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
              style={{ aspectRatio: '16/9' }}
            />
            {!isTesting && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">📡</div>
                  <p className="text-white text-sm">Remote Stream</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error</h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
          >
            Clear Error
          </button>
        </div>
      )}

      {/* Test Information */}
      <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">🧪 Local Test Information</h3>
        <div className="space-y-2 text-blue-700 dark:text-blue-300">
          <p>• <strong>Local Connection:</strong> Tests Simple Peer without server</p>
          <p>• <strong>Two Peers:</strong> Creates initiator and responder locally</p>
          <p>• <strong>Stream Transfer:</strong> Tests video/audio stream between peers</p>
          <p>• <strong>Data Channel:</strong> Tests text message exchange</p>
          <p>• <strong>STUN Servers:</strong> Uses public STUN servers for NAT traversal</p>
        </div>
      </div>

      {/* Browser Console Instructions */}
      <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2">🖥️ Browser Console</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Open browser developer tools (F12) to see detailed Simple Peer logs including:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
          <li>• Peer creation and signaling events</li>
          <li>• ICE candidate exchange</li>
          <li>• Connection state changes</li>
          <li>• Stream receiving events</li>
          <li>• Data channel messages</li>
          <li>• Error details and debugging info</li>
        </ul>
      </div>
    </div>
  )
}