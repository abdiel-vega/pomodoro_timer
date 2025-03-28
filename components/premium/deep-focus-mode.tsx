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
    autoFullscreen: true,
  });
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('deepFocusSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({
            ...prev,
            ...parsedSettings
          }));
        }
      } catch (error) {
        console.error('Failed to load deep focus settings:', error);
      }
    };
    
    loadSettings();
    
    // Also detect DND status if possible
    if (typeof window !== 'undefined' && 'navigator' in window) {
      if (Notification.permission === 'granted') {
        try {
          if ('permissions' in navigator && navigator.permissions) {
            navigator.permissions.query({ name: 'notifications' as PermissionName })
              .then(permissionStatus => {
                if (permissionStatus.state === 'denied') {
                  setSettings(prev => ({ ...prev, doNotDisturb: true }));
                  // Also update localStorage
                  const currentSettings = JSON.parse(localStorage.getItem('deepFocusSettings') || '{}');
                  localStorage.setItem('deepFocusSettings', JSON.stringify({
                    ...currentSettings,
                    doNotDisturb: true
                  }));
                }
              });
          }
        } catch (error) {
          console.log('Unable to detect Do Not Disturb status');
        }
      }
    }
  }, []);

  // Handle settings changes
  const updateSettings = (key: keyof typeof settings, value: boolean) => {
    // Update the local state
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Save to localStorage
      localStorage.setItem('deepFocusSettings', JSON.stringify(newSettings));
      
      // Dispatch custom event for the context to listen to
      window.dispatchEvent(new CustomEvent('deepFocusSettingsChanged', {
        detail: newSettings
      }));
      
      return newSettings;
    });
    
    // Handle special cases
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
    } else if (key === 'autoFullscreen') {
      if (value && deepFocusMode) {
        requestFullscreen();
      } else if (!value && deepFocusMode) {
        exitFullscreen();
      }
    }
  };

  // Helper function to request fullscreen
  const requestFullscreen = () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen();
      } else if ((docEl as any).mozRequestFullScreen) {
        (docEl as any).mozRequestFullScreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        (docEl as any).webkitRequestFullscreen();
      } else if ((docEl as any).msRequestFullscreen) {
        (docEl as any).msRequestFullscreen();
      }
      document.body.classList.add('fullscreen');
    } catch (error) {
      console.error('Failed to enter fullscreen mode:', error);
    }
  };
  
  // Helper function to exit fullscreen
  const exitFullscreen = () => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      document.body.classList.remove('fullscreen');
    } catch (error) {
      console.error('Failed to exit fullscreen mode:', error);
    }
  };
  
  // Apply focus settings
  const applyFocusSettings = (currentSettings: typeof settings, isUpdate = false) => {
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
    // Apply Do Not Disturb setting
    if (currentSettings.doNotDisturb) {
      document.body.classList.add('do-not-disturb');
    } else {
      document.body.classList.remove('do-not-disturb');
    }
    
    // Fullscreen - only toggle if this is a direct update, not initial application
    if (isUpdate) {
      if (currentSettings.autoFullscreen) {
        requestFullscreen();
      } else {
        exitFullscreen();
      }
    } else if (currentSettings.autoFullscreen) {
      // Initial application
      requestFullscreen();
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