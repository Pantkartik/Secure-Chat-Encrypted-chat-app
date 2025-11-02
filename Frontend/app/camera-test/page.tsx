'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CameraTestPage() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null)
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  const [hasStoredPreferences, setHasStoredPreferences] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const saveDevicePreference = (deviceId: string) => {
    try {
      localStorage.setItem('preferredCamera', deviceId)
      addLog(`Device preference saved: ${deviceId}`)
    } catch (error) {
      addLog(`Error saving preference: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const loadDevicePreference = (): string | null => {
    try {
      const preferred = localStorage.getItem('preferredCamera')
      if (preferred) {
        addLog(`Loaded device preference: ${preferred}`)
        setHasStoredPreferences(true)
      }
      return preferred
    } catch (error) {
      addLog(`Error loading preference: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  const clearDevicePreference = () => {
    try {
      localStorage.removeItem('preferredCamera')
      setHasStoredPreferences(false)
      addLog('Device preference cleared')
    } catch (error) {
      addLog(`Error clearing preference: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const getDevices = async () => {
    try {
      addLog('Enumerating devices...')
      
      // Request permissions first to get device labels
      if (devices.length === 0) {
        addLog('Requesting media permissions...')
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        tempStream.getTracks().forEach(track => track.stop())
        addLog('Permissions granted')
      }
      
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput')
      
      addLog(`Found ${videoDevices.length} cameras:`)
      videoDevices.forEach(device => {
        addLog(`  - ${device.label} (${device.deviceId})`)
      })
      
      setDevices(videoDevices)
      
      // Check for stored preference
      const preferredCamera = loadDevicePreference()
      
      if (videoDevices.length > 0) {
        if (preferredCamera) {
          // Check if preferred camera still exists
          const preferredDevice = videoDevices.find(device => device.deviceId === preferredCamera)
          if (preferredDevice) {
            addLog(`Using preferred camera: ${preferredDevice.label}`)
            setSelectedCamera(preferredCamera)
          } else {
            addLog('Preferred camera not found, using first available')
            setSelectedCamera(videoDevices[0].deviceId)
          }
        } else if (!selectedCamera) {
          setSelectedCamera(videoDevices[0].deviceId)
        }
      }
    } catch (error) {
      addLog(`Error getting devices: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const startCamera = async (deviceId?: string) => {
    try {
      addLog(`Starting camera with device: ${deviceId || 'default'}`)
      
      if (currentStream) {
        addLog('Stopping current stream...')
        currentStream.getTracks().forEach(track => track.stop())
      }
      
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      }
      
      addLog('Requesting media with constraints: ' + JSON.stringify(constraints))
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        addLog(`Got video track: ${videoTrack.label} (${videoTrack.id})`)
        const settings = videoTrack.getSettings()
        addLog(`Settings: ${JSON.stringify(settings)}`)
      }
      
      setCurrentStream(stream)
      addLog('Camera started successfully')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Unknown Error';
      
      addLog(`Error starting camera: ${errorMessage}`)
      addLog(`Error name: ${errorName}`)
      
      // Enhanced error handling for common scenarios
      if (errorName === 'NotAllowedError') {
        addLog('❌ Camera permission denied. Please check browser settings.')
      } else if (errorName === 'NotFoundError') {
        addLog('❌ No camera found. Please connect a camera device.')
      } else if (errorName === 'NotReadableError') {
        addLog('❌ Camera is already in use by another application.')
      } else if (errorName === 'OverconstrainedError') {
        addLog('❌ Camera constraints not satisfied. Trying default settings...')
        // Try with basic constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true })
          setCurrentStream(fallbackStream)
          addLog('✅ Camera started with default settings')
          return
        } catch (fallbackError) {
          addLog(`Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`)
        }
      }
      
      if (error instanceof Error && 'constraint' in error) {
        addLog(`Error constraints: ${JSON.stringify((error as any).constraint || 'N/A')}`)
      }
    }
  }

  const switchCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId)
    saveDevicePreference(deviceId)
    await startCamera(deviceId)
  }

  const stopCamera = () => {
    if (currentStream) {
      addLog('Stopping camera...')
      currentStream.getTracks().forEach(track => track.stop())
      setCurrentStream(null)
      addLog('Camera stopped')
    }
  }

  useEffect(() => {
    getDevices()
  }, [])

  // Auto-start camera with preferred device when devices are loaded
  useEffect(() => {
    if (devices.length > 0 && selectedCamera && !currentStream) {
      const preferredDevice = devices.find(device => device.deviceId === selectedCamera)
      if (preferredDevice) {
        addLog(`Auto-starting with preferred camera: ${preferredDevice.label}`)
        startCamera(selectedCamera)
      }
    }
  }, [devices, selectedCamera])

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Camera Switching Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Cameras</h3>
            <div className="flex gap-2 mb-4">
              <Button onClick={getDevices} variant="outline">
                Refresh Devices
              </Button>
              <Button onClick={() => startCamera()} variant="outline">
                Start Default Camera
              </Button>
              <Button onClick={stopCamera} variant="destructive">
                Stop Camera
              </Button>
              {hasStoredPreferences && (
                <Button onClick={clearDevicePreference} variant="outline" className="ml-auto">
                  Clear Preference
                </Button>
              )}
            </div>
            {hasStoredPreferences && (
              <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                ✅ Camera preference stored - will be used automatically
              </div>
            )}
            
            {devices.length > 0 ? (
              <div className="grid gap-2">
                {devices.map((device) => (
                  <div key={device.deviceId} className="flex items-center gap-2">
                    <Button
                      onClick={() => switchCamera(device.deviceId)}
                      variant={selectedCamera === device.deviceId ? "default" : "outline"}
                      className="flex-1 justify-start"
                    >
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No cameras detected. Click "Refresh Devices" to detect cameras.</p>
            )}
          </div>

          {/* Video Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Camera Preview</h3>
            {currentStream ? (
              <div className="relative">
                <video
                  ref={(el) => {
                    if (el && currentStream) {
                      el.srcObject = currentStream
                      el.play().catch(console.error)
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-md rounded-lg border"
                />
                <div className="mt-2 text-sm text-gray-600">
                  <p>Stream active: {currentStream.getVideoTracks().length} video track(s)</p>
                  <p>Selected device: {selectedCamera || 'default'}</p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md h-48 bg-gray-100 rounded-lg flex items-center justify-center border">
                <p className="text-gray-500">No camera active</p>
              </div>
            )}
          </div>

          {/* Debug Logs */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Debug Logs</h3>
            <div className="bg-gray-100 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              ) : (
                <p className="text-gray-500">No logs yet...</p>
              )}
            </div>
            <Button 
              onClick={() => setLogs([])} 
              variant="outline" 
              className="mt-2"
            >
              Clear Logs
            </Button>
          </div>

          {/* Troubleshooting Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">Troubleshooting Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make sure you grant camera permissions when prompted</li>
              <li>• Check that no other application is using the camera</li>
              <li>• Try refreshing the page if devices don't appear</li>
              <li>• Ensure you're using HTTPS (required for camera access)</li>
              <li>• Check browser console for detailed error messages</li>
              <li>• Click "Clear Preference" if you're having issues with a specific camera</li>
              <li>• Try different browsers if permissions are consistently denied</li>
            </ul>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Quick Actions</h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => getDevices()} variant="outline" size="sm">
                🔄 Refresh Devices
              </Button>
              <Button onClick={() => startCamera()} variant="outline" size="sm">
                ▶️ Start Default Camera
              </Button>
              <Button onClick={() => startCamera(selectedCamera)} variant="outline" size="sm" disabled={!selectedCamera}>
                ▶️ Start Selected Camera
              </Button>
              <Button onClick={stopCamera} variant="outline" size="sm" disabled={!currentStream}>
                ⏹️ Stop Camera
              </Button>
              <Button onClick={() => setLogs([])} variant="outline" size="sm">
                🗑️ Clear Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}