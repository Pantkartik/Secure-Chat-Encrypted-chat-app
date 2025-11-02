'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export default function ManualInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window as any).navigator.standalone ||
                      document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);

    // Show prompt if not standalone and not previously dismissed
    if (!standalone) {
      const dismissed = localStorage.getItem('manualInstallPromptDismissed');
      if (!dismissed || (Date.now() - parseInt(dismissed)) > 7 * 24 * 60 * 60 * 1000) {
        // Show after 5 seconds
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleInstallClick = () => {
    // Provide instructions based on browser
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOS) {
      alert('To install: Tap the share button (📤) at the bottom of your screen, then select "Add to Home Screen"');
    } else if (isAndroid) {
      alert('To install: Tap the menu button (⋮) in your browser, then select "Add to Home Screen" or "Install app"');
    } else {
      alert('To install: Look for "Install" or "Add to Home Screen" in your browser menu');
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('manualInstallPromptDismissed', Date.now().toString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 shadow-lg border border-blue-500">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Install Cypher Chat</h3>
              <p className="text-blue-100 text-xs mt-1">
                Install our secure messaging app for faster access and offline support
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Install</span>
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-blue-200 hover:text-white text-sm font-medium transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}