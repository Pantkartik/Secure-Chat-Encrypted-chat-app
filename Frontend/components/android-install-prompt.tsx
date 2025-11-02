'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Download, X, Shield, CheckCircle } from 'lucide-react';

interface AndroidInstallPromptProps {
  className?: string;
}

export default function AndroidInstallPrompt({ className = '' }: AndroidInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Check if app is running as PWA
      if ((window as any).navigator.standalone) {
        setIsInstalled(true);
        return;
      }
    };

    checkInstallation();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'INSTALL_AVAILABLE') {
        setShowPrompt(true);
      } else if (event.data && event.data.type === 'APP_INSTALLED') {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      // Fallback: try to manually trigger install
      if ('beforeinstallprompt' in window) {
        alert('Install not available. Please use your browser menu to install this app.');
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Install prompt failed:', error);
      setShowPrompt(false);
      alert('Install failed. Please try using your browser menu to install this app.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for 7 days
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Check if user previously dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      } else {
        localStorage.removeItem('installPromptDismissed');
      }
    }
  }, []);

  if (!showPrompt || isInstalled) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-6 shadow-2xl border border-white/20 backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Install Cypher Chat</h3>
              <p className="text-purple-100 text-sm">Get the Android app</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-300" />
            <span className="text-white text-sm">End-to-end encrypted messaging</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-300" />
            <span className="text-white text-sm">Secure video calls</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-300" />
            <span className="text-white text-sm">Works offline with sync</span>
          </div>
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-blue-300" />
            <span className="text-white text-sm">Privacy-first design</span>
          </div>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstallClick}
          className="w-full bg-white hover:bg-gray-50 text-purple-600 font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Download className="w-5 h-5" />
          <span>Install Now</span>
        </button>

        {/* Size info */}
        <p className="text-purple-100 text-xs text-center mt-3">
          App size: ~2MB • Free • No ads
        </p>
      </div>
    </div>
  );
}