import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, XCircle, AlertCircle, Smartphone } from 'lucide-react';

interface PWACheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
}

export function PWADebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [checks, setChecks] = useState<PWACheck[]>([]);

  const runPWAChecks = async () => {
    const newChecks: PWACheck[] = [];

    // Check HTTPS
    newChecks.push({
      name: 'HTTPS Connection',
      status: window.location.protocol === 'https:' ? 'pass' : 'fail',
      message: window.location.protocol === 'https:' ? 'Site is served over HTTPS' : 'PWA requires HTTPS in production'
    });

    // Check Service Worker
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        newChecks.push({
          name: 'Service Worker',
          status: registration ? 'pass' : 'fail',
          message: registration ? 'Service Worker is registered' : 'No Service Worker found'
        });
      } else {
        newChecks.push({
          name: 'Service Worker',
          status: 'fail',
          message: 'Service Worker not supported in this browser'
        });
      }
    } catch (error) {
      newChecks.push({
        name: 'Service Worker',
        status: 'fail',
        message: 'Error checking Service Worker'
      });
    }

    // Check Manifest
    try {
      const manifestResponse = await fetch('/manifest.webmanifest');
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        newChecks.push({
          name: 'Web App Manifest',
          status: 'pass',
          message: `Manifest found with ${manifest.icons?.length || 0} icons`
        });

        // Check required manifest fields
        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missingFields = requiredFields.filter(field => !manifest[field]);
        
        if (missingFields.length === 0) {
          newChecks.push({
            name: 'Manifest Fields',
            status: 'pass',
            message: 'All required manifest fields present'
          });
        } else {
          newChecks.push({
            name: 'Manifest Fields',
            status: 'warning',
            message: `Missing fields: ${missingFields.join(', ')}`
          });
        }

        // Check icons
        const hasRequiredIcons = manifest.icons?.some((icon: any) => 
          icon.sizes === '192x192' || icon.sizes === '512x512'
        );
        newChecks.push({
          name: 'Required Icons',
          status: hasRequiredIcons ? 'pass' : 'fail',
          message: hasRequiredIcons ? 'Required icon sizes found' : 'Missing 192x192 or 512x512 icons'
        });

      } else {
        newChecks.push({
          name: 'Web App Manifest',
          status: 'fail',
          message: 'Manifest file not accessible'
        });
      }
    } catch (error) {
      newChecks.push({
        name: 'Web App Manifest',
        status: 'fail',
        message: 'Error fetching manifest'
      });
    }

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    newChecks.push({
      name: 'Installation Status',
      status: isStandalone ? 'warning' : 'pass',
      message: isStandalone ? 'App is already installed' : 'App is not installed'
    });

    // Check user engagement
    const hasUserInteraction = sessionStorage.getItem('user_interaction') === 'true';
    newChecks.push({
      name: 'User Engagement',
      status: hasUserInteraction ? 'pass' : 'warning',
      message: hasUserInteraction ? 'User has interacted with the site' : 'Browsers may require user interaction before showing install prompt'
    });

    // Check browser support
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    let browserStatus: 'pass' | 'warning' | 'fail' = 'warning';
    let browserMessage = 'Unknown browser';
    
    if (isChrome || isEdge) {
      browserStatus = 'pass';
      browserMessage = 'Browser supports PWA install prompts';
    } else if (isSafari) {
      browserStatus = 'warning';
      browserMessage = 'Safari: Users must manually add to home screen';
    } else {
      browserStatus = 'warning';
      browserMessage = 'Browser may have limited PWA support';
    }

    newChecks.push({
      name: 'Browser Support',
      status: browserStatus,
      message: browserMessage
    });

    setChecks(newChecks);
  };

  useEffect(() => {
    // Track user interaction
    const handleUserInteraction = () => {
      sessionStorage.setItem('user_interaction', 'true');
    };
    
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => {
            setIsOpen(true);
            runPWAChecks();
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3"
        >
          <Smartphone className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            PWA Debug Tool
          </h2>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            This tool checks if your PWA meets all requirements for mobile installation.
          </p>
          
          {checks.map((check, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <h3 className="font-medium">{check.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {check.message}
                </p>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Mobile Installation Tips:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Android Chrome: Look for "Add to Home screen" in menu</li>
              <li>• iOS Safari: Tap share button → "Add to Home Screen"</li>
              <li>• Some browsers require user interaction before showing prompt</li>
              <li>• PWA criteria must be met for automatic prompts</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={runPWAChecks} className="flex-1">
              Re-run Checks
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}