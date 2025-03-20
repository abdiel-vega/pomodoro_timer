'use client';

import { useState, useEffect } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EyeIcon, PhoneOff, BellOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function DeepFocusMode() {
  const { isPremium, deepFocusMode, setDeepFocusMode, timerState } = usePomodoroTimer();
  const [darkOverlay, setDarkOverlay] = useState(false);
  
  // Settings for deep focus mode
  const [settings, setSettings] = useState({
    dimInterface: true,
    muteNotifications: true,
    hideElements: true
  });

  // Apply deep focus mode effects
  useEffect(() => {
    if (!isPremium) return;
    
    if (deepFocusMode) {
      // Apply deep focus class to body
      document.body.classList.add('deep-focus-mode');
      
      // Add dark overlay if enabled
      if (settings.dimInterface) {
        setDarkOverlay(true);
      }
      
      // Request notification permissions if needed
      if (settings.muteNotifications && 'Notification' in window) {
        Notification.requestPermission();
      }
      
      // Save original title
      const originalTitle = document.title;
      document.title = "🧠 Focus Mode - " + originalTitle;
      
      // Hide non-essential elements if enabled
      if (settings.hideElements) {
        document.querySelectorAll('.hide-during-focus').forEach(el => {
          (el as HTMLElement).style.opacity = '0.2';
        });
      }
      
      return () => {
        // Clean up
        document.body.classList.remove('deep-focus-mode');
        setDarkOverlay(false);
        document.title = originalTitle;
        
        document.querySelectorAll('.hide-during-focus').forEach(el => {
          (el as HTMLElement).style.opacity = '1';
        });
      };
    }
  }, [deepFocusMode, settings, isPremium]);

  // Handle settings changes
  const updateSettings = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
    <>
      {/* Dark overlay for deep focus mode */}
      {darkOverlay && deepFocusMode && (
        <div className="fixed inset-0 bg-black/40 pointer-events-none z-40" />
      )}
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <EyeIcon size={18} />
            Deep Focus Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            
            <div className="space-y-4 border-t mt-2 pt-4">
              <h4 className="text-sm font-medium">Focus Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneOff size={16} />
                  <Label htmlFor="dimInterface" className="cursor-pointer">
                    Dim interface
                  </Label>
                </div>
                <Switch
                  id="dimInterface"
                  checked={settings.dimInterface}
                  onCheckedChange={(checked) => updateSettings('dimInterface', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellOff size={16} />
                  <Label htmlFor="muteNotifications" className="cursor-pointer">
                    Mute notifications
                  </Label>
                </div>
                <Switch
                  id="muteNotifications"
                  checked={settings.muteNotifications}
                  onCheckedChange={(checked) => updateSettings('muteNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeIcon size={16} />
                  <Label htmlFor="hideElements" className="cursor-pointer">
                    Hide non-essential elements
                  </Label>
                </div>
                <Switch
                  id="hideElements"
                  checked={settings.hideElements}
                  onCheckedChange={(checked) => updateSettings('hideElements', checked)}
                />
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded-md">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-yellow-500" />
                Deep Focus Mode works best with the timer in full screen.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* CSS for deep focus mode */}
      <style jsx global>{`
        body.deep-focus-mode {
          transition: all 0.5s ease;
        }
        
        body.deep-focus-mode header,
        body.deep-focus-mode footer {
          opacity: 0.1;
          transition: opacity 0.5s ease;
        }
        
        body.deep-focus-mode header:hover,
        body.deep-focus-mode footer:hover {
          opacity: 1;
        }
      `}</style>
    </>
  );
}