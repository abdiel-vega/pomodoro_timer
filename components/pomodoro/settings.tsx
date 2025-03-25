/*

settings component

*/
'use client';

import React, { useEffect, useState } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import { useThemeVariant } from '@/components/theme-provider';
import { 
  Paintbrush, 
  Moon, 
  Sun, 
  Sparkles,
  CreditCard,
  PaintBucket
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

// Define theme presets
const LIGHT_THEMES = [
  { id: '', name: 'Default', color: '#000000' },
  { id: 'light-blue', name: 'Blue', color: '#3b82f6' },
  { id: 'light-green', name: 'Green', color: '#10b981' },
  { id: 'light-purple', name: 'Purple', color: '#8b5cf6' },
  { id: 'light-orange', name: 'Orange', color: '#f97316' },
  { id: 'light-red', name: 'Red', color: '#ef4444' },
];

const DARK_THEMES = [
  { id: '', name: 'Default', color: '#ffffff' },
  { id: 'dark-blue', name: 'Blue', color: '#3b82f6' },
  { id: 'dark-green', name: 'Green', color: '#10b981' },
  { id: 'dark-purple', name: 'Purple', color: '#8b5cf6' },
  { id: 'dark-orange', name: 'Orange', color: '#f97316' },
  { id: 'dark-red', name: 'Red', color: '#ef4444' },
];

// Helper function to adjust color brightness
const adjustColorBrightness = (hex: string, percent: number) => {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  // Adjust brightness
  r = Math.min(255, Math.max(0, r + Math.floor(r * percent / 100)));
  g = Math.min(255, Math.max(0, g + Math.floor(g * percent / 100)));
  b = Math.min(255, Math.max(0, b + Math.floor(b * percent / 100)));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Premium Color Themes Component
const PremiumColorThemes = ({ isPremium }: { isPremium: boolean }) => {
  const { theme } = useTheme();
  const { themeVariant, setThemeVariant } = useThemeVariant();
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [customColor, setCustomColor] = useState('#3b82f6'); // Default blue
  const [customTheme, setCustomTheme] = useState('');
  
  // Function to create and apply a custom theme
  const applyCustomTheme = () => {
    if (!isPremium) return;
    
    const isDark = theme === 'dark';
    const uniqueId = `custom-${new Date().getTime()}`;
    
    // Create CSS variables for the custom theme
    let style = document.createElement('style');
    
    if (isDark) {
      style.textContent = `
        .dark[data-theme="${uniqueId}"] {
          --primary: ${customColor};
          --primary-foreground: 0 0% 7%;
          --secondary: ${adjustColorBrightness(customColor, -40)};
          --secondary-foreground: 0 0% 100%;
          --accent: ${adjustColorBrightness(customColor, -60)};
          --accent-foreground: 0 0% 100%;
          --ring: ${customColor};
        }
      `;
    } else {
      style.textContent = `
        [data-theme="${uniqueId}"] {
          --primary: ${customColor};
          --primary-foreground: 0 0% 98%;
          --secondary: ${adjustColorBrightness(customColor, 60)};
          --secondary-foreground: 0 0% 9%;
          --accent: ${adjustColorBrightness(customColor, 80)};
          --accent-foreground: 0 0% 9%;
          --ring: ${customColor};
        }
      `;
    }
    
    document.head.appendChild(style);
    
    // Store the custom theme in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('customThemeColor', customColor);
      localStorage.setItem('customThemeId', uniqueId);
    }
    
    // Apply the custom theme
    setCustomTheme(uniqueId);
    setThemeVariant(uniqueId);
    setColorPickerVisible(false);
    
    toast.success('Custom theme applied');
  };
  
  // Load custom theme on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && isPremium) {
      const savedColor = localStorage.getItem('customThemeColor');
      const savedThemeId = localStorage.getItem('customThemeId');
      
      if (savedColor) {
        setCustomColor(savedColor);
      }
      
      if (savedThemeId) {
        setCustomTheme(savedThemeId);
        
        // Re-create the style for the custom theme if it's currently active
        if (themeVariant === savedThemeId) {
          const isDark = theme === 'dark';
          let style = document.createElement('style');
          
          if (isDark) {
            style.textContent = `
              .dark[data-theme="${savedThemeId}"] {
                --primary: ${savedColor ?? '#000000'};
                --primary-foreground: 0 0% 7%;
                --secondary: ${savedColor ? adjustColorBrightness(savedColor, -40) : '#505050'};
                --secondary-foreground: 0 0% 100%;
                --accent: ${savedColor ? adjustColorBrightness(savedColor, -60) : '#303030'};
                --accent-foreground: 0 0% 100%;
                --ring: ${savedColor ?? '#000000'};
              }
            `;
          } else {
            style.textContent = `
              [data-theme="${savedThemeId}"] {
                --primary: ${savedColor ?? '#3b82f6'};
                --primary-foreground: 0 0% 98%;
                --secondary: ${savedColor ? adjustColorBrightness(savedColor, 60) : '#bfdbfe'};
                --secondary-foreground: 0 0% 9%;
                --accent: ${savedColor ? adjustColorBrightness(savedColor, 80) : '#dbeafe'};
                --accent-foreground: 0 0% 9%;
                --ring: ${savedColor ?? '#3b82f6'};
              }
            `;
          }          
          
          document.head.appendChild(style);
        }
      }
    }
  }, [isPremium, theme, themeVariant]);
  
  if (!isPremium) {
    return (
      <div className="mt-4 p-3 border rounded-md bg-zinc-50 dark:bg-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <h4 className="text-sm font-medium">Premium Color Themes</h4>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Upgrade to Premium to create custom color themes for your timer.
        </p>
      </div>
    );
  }
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <PaintBucket className="h-4 w-4 text-yellow-500" />
          Custom Color Theme
        </h4>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setColorPickerVisible(!colorPickerVisible)}
        >
          {colorPickerVisible ? 'Hide Color Picker' : 'Create Custom Theme'}
        </Button>
      </div>
      
      {colorPickerVisible && (
        <div className="p-3 border rounded-md space-y-3 mt-2">
          <div className="space-y-2">
            <Label htmlFor="customThemeColor" className="text-sm">Primary Color</Label>
            <div className="flex gap-2 items-center">
              <input
                id="customThemeColor"
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-8 w-10 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-24 h-8"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: customColor }}></span>
                <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: adjustColorBrightness(customColor, theme === 'dark' ? -40 : 60) }}></span>
                <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: adjustColorBrightness(customColor, theme === 'dark' ? -60 : 80) }}></span>
              </div>
              <Button size="sm" onClick={applyCustomTheme}>Apply Theme</Button>
            </div>
          </div>
        </div>
      )}
      
      {customTheme && themeVariant === customTheme && (
        <div className="text-xs text-green-600 dark:text-green-400 mt-2">
          Custom theme applied successfully
        </div>
      )}
    </div>
  );
};

export default function Settings() {
  const { settings, updateSettings, isPremium, refreshUserSettings } = usePomodoroTimer();
  const { theme, setTheme } = useTheme();
  const { themeVariant, setThemeVariant } = useThemeVariant();
  
  // Makes sure we display the correct theme tab
  const [activeTab, setActiveTab] = React.useState<string>(theme === 'dark' ? 'dark' : 'light');
  
  // Update active tab when theme changes
  useEffect(() => {
    setActiveTab(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  const handleWorkDurationChange = (values: number[]) => {
    updateSettings({ workDuration: values[0] });
    toast.success(`Work duration updated to ${values[0]} minutes`);
  };

  const handleShortBreakDurationChange = (values: number[]) => {
    updateSettings({ shortBreakDuration: values[0] });
    toast.success(`Short break duration updated to ${values[0]} minutes`);
  };

  const handleLongBreakDurationChange = (values: number[]) => {
    updateSettings({ longBreakDuration: values[0] });
    toast.success(`Long break duration updated to ${values[0]} minutes`);
  };

  const handleLongBreakIntervalChange = (values: number[]) => {
    updateSettings({ longBreakInterval: values[0] });
    toast.success(`Long break interval updated to every ${values[0]} pomodoros`);
  };

  const handleAutoStartBreaksChange = (checked: boolean) => {
    updateSettings({ autoStartBreaks: checked });
    toast.success(`Auto-start breaks ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleAutoStartPomodorosChange = (checked: boolean) => {
    updateSettings({ autoStartPomodoros: checked });
    toast.success(`Auto-start pomodoros ${checked ? 'enabled' : 'disabled'}`);
  };

  const handleNotificationsChange = (checked: boolean) => {
    updateSettings({ notifications: checked });
    
    // Request notification permission if enabling
    if (checked && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast.success('Notifications enabled');
          } else {
            toast.error('Notification permission denied');
            // Revert the setting since permission was denied
            updateSettings({ notifications: false });
          }
        });
      } else if (Notification.permission === 'denied') {
        toast.error('Notification permission denied. Please enable in browser settings.');
      } else {
        toast.success('Notifications enabled');
      }
    } else {
      toast.success(`Notifications ${checked ? 'enabled' : 'disabled'}`);
    }
  };

  // Handle theme mode change
  const handleThemeModeChange = (mode: string) => {
    setTheme(mode);
  };

  // Handle theme variant selection
  const handleThemeVariantChange = (variant: string) => {
    setThemeVariant(variant);
    toast.success('Theme updated');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Timer Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Work Duration */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="workDuration">Work Duration</Label>
              <span className="text-sm">{settings.workDuration} minutes</span>
            </div>
            <Slider
              id="workDuration"
              min={1}
              max={60}
              step={1}
              value={[settings.workDuration]}
              onValueChange={handleWorkDurationChange}
              className="mt-2"
            />
          </div>

          {/* Short Break Duration */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="shortBreakDuration">Short Break Duration</Label>
              <span className="text-sm">{settings.shortBreakDuration} minutes</span>
            </div>
            <Slider
              id="shortBreakDuration"
              min={1}
              max={15}
              step={1}
              value={[settings.shortBreakDuration]}
              onValueChange={handleShortBreakDurationChange}
              className="mt-2"
            />
          </div>

          {/* Long Break Duration */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="longBreakDuration">Long Break Duration</Label>
              <span className="text-sm">{settings.longBreakDuration} minutes</span>
            </div>
            <Slider
              id="longBreakDuration"
              min={5}
              max={30}
              step={1}
              value={[settings.longBreakDuration]}
              onValueChange={handleLongBreakDurationChange}
              className="mt-2"
            />
          </div>

          {/* Long Break Interval */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="longBreakInterval">Long Break After</Label>
              <span className="text-sm">{settings.longBreakInterval} pomodoros</span>
            </div>
            <Slider
              id="longBreakInterval"
              min={2}
              max={8}
              step={1}
              value={[settings.longBreakInterval]}
              onValueChange={handleLongBreakIntervalChange}
              className="mt-2"
            />
          </div>

          {/* Auto-start Settings */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoStartBreaks" className="cursor-pointer">
                Auto-start Breaks
              </Label>
              <Switch
                id="autoStartBreaks"
                checked={settings.autoStartBreaks}
                onCheckedChange={handleAutoStartBreaksChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoStartPomodoros" className="cursor-pointer">
                Auto-start Focus Time
              </Label>
              <Switch
                id="autoStartPomodoros"
                checked={settings.autoStartPomodoros}
                onCheckedChange={handleAutoStartPomodorosChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="cursor-pointer">
                Notifications
              </Label>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={handleNotificationsChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleThemeModeChange}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="light">
                  <Sun className="h-4 w-4 mr-1" />
                  Light Mode
                </TabsTrigger>
                <TabsTrigger value="dark">
                  <Moon className="h-4 w-4 mr-1" />
                  Dark Mode
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="light" className="space-y-4">
              <h3 className="text-sm font-medium mb-2">Color Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {LIGHT_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    className={`flex flex-col items-center p-3 cursor-pointer rounded-md border transition-all hover:shadow-md ${
                      themeVariant === theme.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleThemeVariantChange(theme.id)}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2" 
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="text-xs">{theme.name}</span>
                  </div>
                ))}
              </div>
              
              {/* Premium custom color theme component */}
              <PremiumColorThemes isPremium={isPremium} />
            </TabsContent>

            <TabsContent value="dark" className="space-y-4">
              <h3 className="text-sm font-medium mb-2">Color Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {DARK_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    className={`flex flex-col items-center p-3 cursor-pointer rounded-md border transition-all hover:shadow-md ${
                      themeVariant === theme.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleThemeVariantChange(theme.id)}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2" 
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="text-xs">{theme.name}</span>
                  </div>
                ))}
              </div>
              
              {/* Premium custom color theme component */}
              <PremiumColorThemes isPremium={isPremium} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Premium button section */}
      <Card>
        <CardContent className="pt-6">
          {isPremium ? (
            <>
              <h3 className="text-lg font-medium mb-2">Premium Features</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage all your premium features including sounds, animations, and analytics.
              </p>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/premium'}
              >
                <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />
                Premium Settings
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-2">Upgrade to Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get access to animated timers, ambient sounds, focus analytics, custom themes, and more with a one-time purchase.
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-amber-300 to-yellow-500 hover:from-amber-400 hover:to-yellow-600"
                onClick={() => window.location.href = '/premium'}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Purchase Premium
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}