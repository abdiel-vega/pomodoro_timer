'use client';

import { useState } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Button } from '@/components/ui/button';
import { Music, EyeIcon, Sparkles } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// Sound categories
const SOUNDS = {
  nature: [
    { id: 'rain', name: 'Rainfall', url: '/sounds/rain.mp3' },
    { id: 'forest', name: 'Forest', url: '/sounds/forest.mp3' },
    { id: 'waves', name: 'Ocean Waves', url: '/sounds/waves.mp3' },
  ],
  ambient: [
    { id: 'cafe', name: 'Coffee Shop', url: '/sounds/cafe.mp3' },
    { id: 'fireplace', name: 'Fireplace', url: '/sounds/fireplace.mp3' },
    { id: 'whitenoise', name: 'White Noise', url: '/sounds/whitenoise.mp3' },
  ],
  music: [
    { id: 'lofi', name: 'Lo-Fi Beats', url: '/sounds/lofi.mp3' },
    { id: 'classical', name: 'Classical', url: '/sounds/classical.mp3' },
    { id: 'ambient', name: 'Ambient', url: '/sounds/ambient.mp3' },
  ],
};

// Animation display names - maps technical names to user-friendly display names
const ANIMATION_NAMES = {
  zenCircles: 'Zen',
  pulse: 'Pulse',
  particles: 'Particles',
  wave: 'Wave',
  breathing: 'Breathing',
};

export default function HomePremiumControls() {
  const {
    isPremium,
    animationType,
    setAnimationType,
    soundEnabled,
    setSoundEnabled,
    currentSound,
    setCurrentSound,
    deepFocusMode,
    setDeepFocusMode,
  } = usePomodoroTimer();
  
  const [volume, setVolume] = useState(70);
  const [soundCategory, setSoundCategory] = useState('nature');

  // If user isn't premium, don't show anything
  if (!isPremium) {
    return null;
  }

  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    
    // Update audio volume in context
    if (window.audioElement) {
      window.audioElement.volume = newVolume / 100;
    }
  };

  // Select a sound
  const selectSound = (soundId: string) => {
    setCurrentSound(soundId);
    setSoundEnabled(true);
  };

  // Toggle deep focus mode
  const toggleDeepFocusMode = (enabled: boolean) => {
    setDeepFocusMode(enabled);
    
    if (enabled) {
      toast.success("Deep Focus Mode activated. Stay focused!");
    } else {
      toast.info("Deep Focus Mode deactivated");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card/50 rounded-lg p-3 border border-zinc-100 dark:border-zinc-600 mb-4">
      <div className="flex items-center gap-1 text-sm mb-3 justify-center">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <span className="font-medium">Premium Features</span>
      </div>
      
      <div className="flex items-center justify-between px-2">
        {/* Timer Effects */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Sparkles className="h-4 w-4 mr-1" /> Effects
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Timer Animation</h4>
              <div className="flex flex-wrap gap-1">
                {Object.entries(ANIMATION_NAMES).map(([key, displayName]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={animationType === key ? "default" : "outline"}
                    className="h-8 text-xs px-2"
                    onClick={() => setAnimationType(key)}
                  >
                    {displayName}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Ambient Sounds */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-8 ${soundEnabled ? 'bg-muted' : ''}`}
            >
              <Music className="h-4 w-4 mr-1" /> Sounds
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled" className="text-sm font-medium">
                  Enable Sounds
                </Label>
                <Switch
                  id="sound-enabled"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
              
              {soundEnabled && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="volume" className="text-sm">Volume: {volume}%</Label>
                    <Slider
                      id="volume"
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                    />
                  </div>
                  
                  <Tabs defaultValue="nature" value={soundCategory} onValueChange={setSoundCategory}>
                    <TabsList className="w-full">
                      <TabsTrigger value="nature" className="flex-1">Nature</TabsTrigger>
                      <TabsTrigger value="ambient" className="flex-1">Ambient</TabsTrigger>
                      <TabsTrigger value="music" className="flex-1">Music</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {SOUNDS[soundCategory as keyof typeof SOUNDS].map((sound) => {
                      const isActive = currentSound === sound.id && soundEnabled;
                      
                      return (
                        <Button
                          key={sound.id}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => selectSound(sound.id)}
                        >
                          {sound.name}
                        </Button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Deep Focus Mode - Changed to Switch */}
        <div className="flex items-center gap-2">
          <Label htmlFor="focus-mode" className="cursor-pointer text-sm flex items-center gap-1">
            <EyeIcon className="h-4 w-4" /> Deep Focus
          </Label>
          <Switch
            id="focus-mode"
            checked={deepFocusMode}
            onCheckedChange={toggleDeepFocusMode}
          />
        </div>
      </div>
    </div>
  );
}