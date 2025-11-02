'use client'

import { useState, useRef, useEffect } from 'react'

/**
 * Simple standalone video call test component
 * Tests basic camera/microphone functionality without server requirements
 */
export default function SimpleVideoTest() {
  const [isTesting, setIsTesting] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedMic, setSelectedMic] = useState('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Get available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceInfos = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = deviceInfos.filter(device => device.kind === 'videoinput')
        const audioDevices = deviceInfos.filter(device => device.kind === 'audioinput')
        
        setDevices(deviceInfos)
        if (videoDevices.length > 0 && !selectedCamera) {
          setSelectedCamera(videoDevices[0].deviceId)
        }
        if (audioDevices.length > 0 && !selectedMic) {
          setSelectedMic(audioDevices[0].deviceId)
        }
      } catch (err) {
        console.error('Error getting devices:', err)
      }
    }

    getDevices()
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices)
    }
  }, [])

  const startTest = async () => {
    setError(null)
    setIsTesting(true)

    try {
      // Request media with specific constraints
      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 2 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setHasPermission(true)
      
      // Monitor stream health
      const videoTrack = stream.getVideoTracks()[0]
      const audioTrack = stream.getAudioTracks()[0]
      
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log('Video track ended')
          stopTest()
        }
        
        videoTrack.onmute = () => {
          console.log('Video track muted')
        }
        
        videoTrack.onunmute = () => {
          console.log('Video track unmuted')
        }
      }
      
      if (audioTrack) {
        audioTrack.onended = () => {
          console.log('Audio track ended')
          stopTest()
        }
      }
      
    } catch (err) {
      console.error('Error starting test:', err)
      setError(err instanceof Error ? err.message : 'Failed to access media devices')
      setIsTesting(false)
    }
  }

  const stopTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsTesting(false)
    setHasPermission(false)
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId)
    if (isTesting && streamRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: {
            deviceId: selectedMic ? { exact: selectedMic } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        
        // Replace tracks
        const oldVideoTrack = streamRef.current.getVideoTracks()[0]
        const newVideoTrack = newStream.getVideoTracks()[0]
        
        if (oldVideoTrack && newVideoTrack) {
          streamRef.current.removeTrack(oldVideoTrack)
          oldVideoTrack.stop()
          streamRef.current.addTrack(newVideoTrack)
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current
        }
        
      } catch (err) {
        console.error('Error switching camera:', err)
        setError('Failed to switch camera')
      }
    }
  }

  const switchMic = async (deviceId: string) => {
    setSelectedMic(deviceId)
    if (isTesting && streamRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedCamera ? { exact: selectedCamera } : undefined
          },
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: { ideal: 48000 },
            channelCount: { ideal: 2 }
          }
        })
        
        // Replace audio track
        const oldAudioTrack = streamRef.current.getAudioTracks()[0]
        const newAudioTrack = newStream.getAudioTracks()[0]
        
        if (oldAudioTrack && newAudioTrack) {
          streamRef.current.removeTrack(oldAudioTrack)
          oldAudioTrack.stop()
          streamRef.current.addTrack(newAudioTrack)
        }
        
      } catch (err) {
        console.error('Error switching microphone:', err)
        setError('Failed to switch microphone')
      }
    }
  }

  const videoDevices = devices.filter(device => device.kind === 'videoinput')
  const audioDevices = devices.filter(device => device.kind === 'audioinput')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎥 Video Call Hardware Test</h1>
      
      {/* Status */}
      <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-2">Test Status</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isTesting ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>Camera: {isTesting ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              hasPermission ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span>Permissions: {hasPermission ? 'Granted' : 'Not Requested'}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4">Controls</h2>
        <div className="flex gap-4 mb-4">
          {!isTesting ? (
            <button
              onClick={startTest}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Test
            </button>
          ) : (
            <button
              onClick={stopTest}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Stop Test
            </button>
          )}
        </div>

        {/* Device Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Camera</label>
            <select
              value={selectedCamera}
              onChange={(e) => switchCamera(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
              disabled={!isTesting}
            >
              {videoDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Microphone</label>
            <select
              value={selectedMic}
              onChange={(e) => switchMic(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700"
              disabled={!isTesting}
            >
              {audioDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Video Preview */}
      <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4">Video Preview</h2>
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full max-w-2xl rounded-lg bg-black"
            style={{ aspectRatio: '16/9' }}
          />
          {!isTesting && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-2">📹</div>
                <p className="text-white">Click "Start Test" to begin</p>
              </div>
            </div>
          )}
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

      {/* Test Instructions */}
      <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">🧪 Test Instructions</h3>
        <div className="space-y-2 text-blue-700 dark:text-blue-300">
          <p>• <strong>Start Test:</strong> Click to begin camera/microphone test</p>
          <p>• <strong>Device Switching:</strong> Change camera/microphone while testing</p>
          <p>• <strong>Monitor Console:</strong> Check browser console for detailed logs</p>
          <p>• <strong>Permissions:</strong> Allow camera/microphone when prompted</p>
          <p>• <strong>Track Health:</strong> Watch for automatic track recovery</p>
        </div>
      </div>

      {/* Browser Console Log */}
      <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-2">🖥️ Browser Console</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Open browser developer tools (F12) to see detailed logs including:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
          <li>• Device enumeration results</li>
          <li>• Media stream creation events</li>
          <li>• Track lifecycle events (mute/unmute/end)</li>
          <li>• Device switching operations</li>
          <li>• Error details and stack traces</li>
        </ul>
      </div>
    </div>
  )
}