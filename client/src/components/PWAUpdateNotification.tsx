import React, { useState, useEffect } from 'react';
import { usePWA } from '@/utils/pwa-manager';

const PWAUpdateNotification: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const { checkForUpdates, activateUpdate } = usePWA();

  useEffect(() => {
    const checkUpdates = async () => {
      const updateAvailable = await checkForUpdates();
      if (updateAvailable) {
        setShowUpdatePrompt(true);
      }
    };

    // Check for updates on mount and then every 5 minutes
    checkUpdates();
    const interval = setInterval(checkUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  const handleUpdate = async () => {
    setShowUpdatePrompt(false);
    await activateUpdate();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed top-4 left-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Update Available</h3>
          <p className="text-sm opacity-90">A new version of SportsApp is ready to install.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleUpdate}
            className="bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Update
          </button>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 text-sm"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;