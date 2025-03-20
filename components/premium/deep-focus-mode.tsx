'use client';

import { useState } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EyeIcon, PhoneOff, BellOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeepFocusMode() {
  const { isPremium, deepFocusMode } = usePomodoroTimer();
  
  // Settings for deep focus mode (these would ideally be part of the context)
  const [settings, setSettings] = useState({
    dimInterface: true,
    muteNotifications: true,
    hideElements: true
  });

  // Handle settings changes
  const updateSettings = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply settings immediately through CSS variables
    if (key === 'dimInterface') {
      document.documentElement.style.setProperty('--focus-dim-amount', value ? '0.1' : '0.5');
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
        <CardTitle className="text-lg flex items-center gap-2">
          <EyeIcon size={18} />
          Deep Focus Mode Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Deep Focus Status</h3>
              <p className="text-sm text-muted-foreground">
                {deepFocusMode ? "Currently active" : "Currently inactive"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Toggle Deep Focus Mode from the home screen
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${deepFocusMode ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
              {deepFocusMode ? "Active" : "Inactive"}
            </div>
          </div>
          
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
  );
}