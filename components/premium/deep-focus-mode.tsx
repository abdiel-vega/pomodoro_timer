'use client';

import { useState, useEffect } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EyeIcon, MoonIcon, LayoutDashboard, Maximize, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DeepFocusMode() {
  const { isPremium, deepFocusMode, setDeepFocusMode } = usePomodoroTimer();
  
  // Settings for deep focus mode
  const [settings, setSettings] = useState({
    doNotDisturb: false,
    hideHeaderFooter: true,
    autoFullscreen: true, // New setting for auto-fullscreen
  });
  
  // Check for OS Do Not Disturb status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // Use Notification API to check permission status
      if (Notification.permission === 'granted') {
        // Try to detect do not disturb when possible
        try {
          if ('permissions' in navigator && navigator.permissions) {
            navigator.permissions.query({ name: 'notifications' as PermissionName })
              .then(permissionStatus => {
                // If notifications aren't allowed, DND might be on
                if (permissionStatus.state === 'denied') {
                  setSettings(prev => ({ ...prev, doNotDisturb: true }));
                }
              });
          }
        } catch (error) {
          console.log('Unable to detect Do Not Disturb status');
        }
      }
    }
    
    // Load saved settings
    const savedSettings = localStorage.getItem('deepFocusSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsedSettings
        }));
      } catch (error) {
        console.error('Failed to parse saved deep focus settings:', error);
      }
    }
  }, []);

  // Handle settings changes
  const updateSettings = (key: keyof typeof settings, value: boolean) => {
    // Update the local state
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    
    setSettings(updatedSettings);
    
    // Save to localStorage
    localStorage.setItem('deepFocusSettings', JSON.stringify(updatedSettings));
    
    // If deep focus mode is active, apply settings immediately
    if (deepFocusMode) {
      applyFocusSettings(updatedSettings);
    }
    
    // Special handling for doNotDisturb
    if (key === 'doNotDisturb' && value) {
      if (Notification.permission === 'denied') {
        toast.info('The app will respect your system Do Not Disturb settings');
      } else {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast.info('Notifications will be suppressed during focus time');
          } else {
            toast.info('Unable to access notification settings');
          }
        });
      }
    }
  };
  
  // Apply focus settings
  const applyFocusSettings = (currentSettings: typeof settings) => {
    // Hide header and footer
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    
    if (currentSettings.hideHeaderFooter) {
      if (header) header.classList.add('focus-hidden');
      if (footer) footer.classList.add('focus-hidden');
    } else {
      if (header) header.classList.remove('focus-hidden');
      if (footer) footer.classList.remove('focus-hidden');
    }
    
    // Do Not Disturb setting
    if (currentSettings.doNotDisturb) {
      document.body.classList.add('do-not-disturb');
    } else {
      document.body.classList.remove('do-not-disturb');
    }
  };

  if (!isPremium) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Deep Focus Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Upgrade to Premium to access Deep Focus Mode</p>
            <Button 
              className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
              onClick={() => window.location.href = '/premium'}
            >
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 border-b border-accent-foreground pb-3">
          <EyeIcon size={18} />
          Deep Focus Mode Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MoonIcon size={16} />
                <Label htmlFor="doNotDisturb" className="cursor-pointer">
                  Do Not Disturb
                </Label>
              </div>
              <Switch
                id="doNotDisturb"
                checked={settings.doNotDisturb}
                onCheckedChange={(checked) => updateSettings('doNotDisturb', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutDashboard size={16} />
                <Label htmlFor="hideHeaderFooter" className="cursor-pointer">
                  Hide header and footer
                </Label>
              </div>
              <Switch
                id="hideHeaderFooter"
                checked={settings.hideHeaderFooter}
                onCheckedChange={(checked) => updateSettings('hideHeaderFooter', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Maximize size={16} />
                <Label htmlFor="autoFullscreen" className="cursor-pointer">
                  Auto-fullscreen mode
                </Label>
              </div>
              <Switch
                id="autoFullscreen"
                checked={settings.autoFullscreen}
                onCheckedChange={(checked) => updateSettings('autoFullscreen', checked)}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded-md">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-yellow-500" />
              Toggle Deep Focus Mode from the home screen to apply these settings.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}