import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Share, Plus, Smartphone, ArrowDown } from 'lucide-react';

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    setIsInstalled(isStandalone || isFullscreen);

    // Show prompt for iOS devices after delay
    if (isIOSDevice && !isStandalone && !isFullscreen) {
      const hasShown = localStorage.getItem('ios-install-prompt-shown');
      const hasDismissed = sessionStorage.getItem('ios-install-dismissed');
      
      if (!hasShown && !hasDismissed) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem('ios-install-prompt-shown', Date.now().toString());
        }, 8000); // Show after 8 seconds for iOS
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('ios-install-dismissed', 'true');
  };

  const handleGotIt = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-understood', 'true');
  };

  if (!isIOS || isInstalled || !showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <div className="bg-white/20 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Smartphone className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Install SportsApp</h3>
            <p className="text-blue-100 text-sm mt-1">Get the full app experience!</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm">
              Install SportsApp on your iPhone for faster access, offline use, and a native app experience.
            </p>
          </div>

          {/* Step by step instructions */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                <span className="text-sm font-bold">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Tap the <strong>Share</strong> button at the bottom of Safari
                </p>
                <div className="mt-2 flex items-center justify-center bg-gray-50 rounded-lg p-3">
                  <Share className="h-6 w-6 text-blue-500" />
                  <ArrowDown className="h-4 w-4 text-gray-400 ml-2" />
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                <span className="text-sm font-bold">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </p>
                <div className="mt-2 flex items-center justify-center bg-gray-50 rounded-lg p-3">
                  <Plus className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600 ml-2">Add to Home Screen</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                <span className="text-sm font-bold">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Tap <strong>"Add"</strong> to install the app
                </p>
                <div className="mt-2 text-center bg-gray-50 rounded-lg p-3">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Add
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-6 bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">Benefits:</h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Faster loading times</li>
              <li>• Works offline</li>
              <li>• No browser UI - full screen</li>
              <li>• Easy access from home screen</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 mt-6">
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Not Now
            </Button>
            <Button
              onClick={handleGotIt}
              size="sm"
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              Got It!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}