import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

export function HTTPInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isHTTPS, setIsHTTPS] = useState(false);

  useEffect(() => {
    const isHTTPSConnection = window.location.protocol === 'https:';
    setIsHTTPS(isHTTPSConnection);
    
    // Show prompt after a delay for HTTP connections
    if (!isHTTPSConnection) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // Show after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('http-install-prompt-dismissed', 'true');
  };

  // Don't show if already dismissed or on HTTPS
  if (isHTTPS || localStorage.getItem('http-install-prompt-dismissed')) {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <h3 className="font-medium">Add to Home Screen</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-sm text-blue-100 mb-4">
        Install SportsApp for a better experience! Follow these steps:
      </p>
      
      <div className="space-y-2 text-sm text-blue-100 mb-4">
        <div className="flex items-center space-x-2">
          <Monitor className="h-4 w-4" />
          <span><strong>Chrome/Edge:</strong> Menu → Install SportsApp</span>
        </div>
        <div className="flex items-center space-x-2">
          <Smartphone className="h-4 w-4" />
          <span><strong>Mobile:</strong> Menu → Add to Home Screen</span>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
          className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Maybe Later
        </Button>
        <Button
          onClick={handleDismiss}
          size="sm"
          className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
        >
          Got It!
        </Button>
      </div>
    </div>
  );
}