'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle } from 'lucide-react';

export default function PWAInstaller() {
  const [installState, setInstallState] = useState<'checking' | 'available' | 'installed' | 'unsupported'>('checking');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    checkInstallStatus();
    
    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallState('available');
      console.log('Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check for app installed
    const handleAppInstalled = () => {
      setInstallState('installed');
      console.log('App was installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const checkInstallStatus = () => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window as any).navigator.standalone ||
                        document.referrer.includes('android-app://');

    if (isStandalone) {
      setInstallState('installed');
      return;
    }

    // Check if PWA is supported
    if ('serviceWorker' in navigator && 'beforeinstallprompt' in window) {
      setInstallState('checking');
      // Give it a moment to see if beforeinstallprompt fires
      setTimeout(() => {
        if (installState === 'checking') {
          setInstallState('available');
        }
      }, 2000);
    } else {
      setInstallState('unsupported');
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setInstallState('installed');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install failed:', error);
        // Fallback to manual instructions
        showManualInstructions();
      }
    } else {
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      alert('To install on iOS:\n1. Tap the share button (📤) at the bottom\n2. Select "Add to Home Screen"\n3. Tap "Add" to confirm');
    } else if (isAndroid) {
      alert('To install on Android:\n1. Tap the menu button (⋮) in your browser\n2. Select "Add to Home Screen" or "Install app"\n3. Follow the prompts to install');
    } else {
      alert('To install this app:\n1. Look for "Install" or "Add to Home Screen" in your browser menu\n2. Follow the prompts to install');
    }
  };

  if (installState === 'installed' || installState === 'checking') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-sm border">
      <div className="flex items-start space-x-3">
        <div className="bg-blue-100 rounded-lg p-2">
          <Smartphone className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">
            {installState === 'available' ? 'Install Cypher Chat' : 'Install Our App'}
          </h3>
          <p className="text-gray-600 text-xs mt-1">
            {installState === 'available' 
              ? 'Install our secure messaging app for faster access'
              : 'Get the best experience with our app'
            }
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleInstall}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setInstallState('installed')} // Hide for now
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}