export const dynamic = 'force-dynamic';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">You're Offline</h1>
          <p className="text-gray-400 mb-6">
            Cypher Chat requires an internet connection to send and receive encrypted messages.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">What you can do:</h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Wait for connection to be restored</li>
            </ul>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Cypher Chat. Built with security and privacy in mind.
          </p>
        </div>
      </div>
    </div>
  );
}