import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdateNotification() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      console.log('App ready to work offline');
    }
    
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [offlineReady, needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowUpdatePrompt(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5" />
          <h3 className="font-medium">Update Available</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={close}
          className="h-6 w-6 p-0 text-white hover:bg-blue-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-blue-100 mb-4">
        A new version of SportsApp is available. Refresh to get the latest features.
      </p>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={close}
          className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Later
        </Button>
        <Button
          onClick={handleUpdate}
          size="sm"
          className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
        >
          Update
        </Button>
      </div>
    </div>
  );
}