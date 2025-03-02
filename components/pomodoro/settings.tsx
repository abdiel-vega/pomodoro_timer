/*

settings component

*/
'use client';

import React from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function Settings() {
  const { settings, updateSettings } = usePomodoroTimer();

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

  return (
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
              Auto-start Pomodoros
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
  );
}