'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if user is on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = (window as any).navigator.standalone || isStandalone;

    if (!isInstalled) {
      // Show prompt after 3 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
      console.log('Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if install is available immediately
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Install prompt failed:', error);
        setShowPrompt(false);
      }
    } else {
      console.log('No install prompt available');
      // Fallback: try to manually trigger install
      if ('beforeinstallprompt' in window) {
        alert('Install not available. Please use your browser menu to install this app.');
      }
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    // Store in localStorage to not show again for 7 days
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Check if previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 shadow-lg border border-purple-500">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Install Cypher Chat</h3>
              <p className="text-purple-100 text-xs mt-1">
                {isIOS 
                  ? "Tap the share button and select 'Add to Home Screen'" 
                  : "Install our app for faster access and offline messaging"
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-purple-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {!isIOS && (
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
              className="px-4 py-2 text-purple-200 hover:text-white text-sm font-medium transition-colors"
            >
              Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}