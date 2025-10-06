import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Smartphone, Monitor, Share, Plus, MoreVertical } from 'lucide-react';

export function MobileInstallGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    setUserAgent(navigator.userAgent);
    
    // Show guide on mobile devices after some interaction
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasShownGuide = localStorage.getItem('install-guide-shown');
    
    if (isMobile && !isStandalone && !hasShownGuide) {
      const timer = setTimeout(() => {
        setShowGuide(true);
        localStorage.setItem('install-guide-shown', 'true');
      }, 10000); // Show after 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);

  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);

  const handleClose = () => {
    setShowGuide(false);
  };

  if (!showGuide) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setShowGuide(true)}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg"
          title="How to install this app"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Install SportsApp
          </h3>
          <Button variant="ghost" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Get the full app experience! Install SportsApp on your device for faster access and offline functionality.
          </p>
          
          {isIOS && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <Share className="h-4 w-4" />
                iPhone/iPad Instructions:
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Tap the Share button <Share className="h-3 w-3 inline" /> at the bottom</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to install the app</li>
              </ol>
            </div>
          )}
          
          {isAndroid && isChrome && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Android Chrome Instructions:
              </h4>
              <ol className="text-sm text-green-800 dark:text-green-200 space-y-1 list-decimal list-inside">
                <li>Tap the menu button <MoreVertical className="h-3 w-3 inline" /> (three dots)</li>
                <li>Look for "Add to Home screen" or "Install app"</li>
                <li>Tap it and follow the prompts</li>
              </ol>
            </div>
          )}
          
          {isAndroid && !isChrome && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                Android Other Browsers:
              </h4>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                For the best experience, please open this site in Chrome browser and look for the "Add to Home screen" option in the menu.
              </p>
            </div>
          )}
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Benefits of Installing:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Faster loading times</li>
              <li>• Works offline</li>
              <li>• Home screen icon</li>
              <li>• Full-screen experience</li>
              <li>• Push notifications (coming soon)</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleClose} className="flex-1">
              Got it!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}