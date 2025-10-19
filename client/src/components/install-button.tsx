import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export function InstallButton() {
  const { canInstall, handleInstall } = usePWAInstall();

  // Don't show if already installed or not installable
  if (!canInstall) return null;

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 text-sm"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Install App</span>
      <Smartphone className="h-4 w-4 sm:hidden" />
    </Button>
  );
}