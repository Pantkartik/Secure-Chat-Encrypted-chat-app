'use client'

import Link from 'next/link'

export default function VideoCallTestIndex() {
  const testOptions = [
    {
      title: "🔧 Hardware Test",
      description: "Test camera and microphone functionality without server requirements",
      path: "/test/hardware-test",
      features: ["Camera access", "Microphone access", "Device switching", "Stream monitoring"]
    },
    {
      title: "🔄 Local Simple Peer Test",
      description: "Test Simple Peer functionality locally without server",
      path: "/test/local-peer-test",
      features: ["Local peer connection", "Stream transfer", "Data channel", "No server required"]
    },
    {
      title: "🌐 Full Video Call Test",
      description: "Test complete video call functionality with server",
      path: "/test/video-call",
      features: ["Real-time calls", "Individual & group calls", "Audio-only mode", "Server-based"]
    }
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎥 Video Call Testing Suite</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Choose a test option below to verify video call functionality. Each test is designed to validate different aspects of the video calling system.
      </p>

      <div className="grid gap-6">
        {testOptions.map((option, index) => (
          <div key={index} className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{option.title}</h2>
                <p className="text-gray-600 dark:text-gray-400">{option.description}</p>
              </div>
              <Link
                href={option.path}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Test
              </Link>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features Tested:</h3>
              <div className="flex flex-wrap gap-2">
                {option.features.map((feature, featureIndex) => (
                  <span
                    key={featureIndex}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Test Server Status */}
      <div className="mt-8 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🖥️ Test Server Status</h3>
        <div className="space-y-2 text-yellow-700 dark:text-yellow-300">
          <p>• <strong>Test Server:</strong> Running on port 3002</p>
          <p>• <strong>Dev Server:</strong> Running on port 3003</p>
          <p>• <strong>Full Test:</strong> Requires both servers running</p>
          <p>• <strong>Hardware/Local Tests:</strong> No server required</p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="mt-6 p-4 rounded-lg bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700">
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">🚀 Quick Start Guide</h3>
        <div className="space-y-2 text-green-700 dark:text-green-300">
          <p>1. <strong>Start with Hardware Test:</strong> Verify camera/microphone work</p>
          <p>2. <strong>Try Local Peer Test:</strong> Test Simple Peer functionality</p>
          <p>3. <strong>Run Full Test:</strong> Test complete video calling system</p>
          <p>4. <strong>Check Console:</strong> Monitor browser console for detailed logs</p>
        </div>
      </div>

      {/* Documentation Links */}
      <div className="mt-6 p-4 rounded-lg bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">📚 Documentation</h3>
        <div className="space-y-1">
          <Link 
            href="/VIDEO_CALL_TEST_GUIDE.md" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target="_blank"
          >
            📖 Complete Testing Guide
          </Link>
          <br />
          <Link 
            href="/SIMPLE_PEER_COMPARISON.md" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target="_blank"
          >
            🔍 Simple Peer vs WebRTC Comparison
          </Link>
        </div>
      </div>
    </div>
  )
}