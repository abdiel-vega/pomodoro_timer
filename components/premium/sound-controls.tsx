'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX, Music, CloudRain, Wind, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { playSound, stopSound, setVolume } from '@/lib/audio.helper';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';

// Sound categories and sources
const SOUNDS = {
  nature: [
    { id: 'rain', name: 'Rainfall', icon: CloudRain, url: '/sounds/rain.mp3' },
    { id: 'forest', name: 'Forest', icon: Wind, url: '/sounds/forest.mp3' },
    { id: 'waves', name: 'Ocean Waves', icon: Wind, url: '/sounds/waves.mp3' },
  ],
  ambient: [
    { id: 'cafe', name: 'Coffee Shop', icon: Users, url: '/sounds/cafe.mp3' },
    { id: 'fireplace', name: 'Fireplace', icon: Users, url: '/sounds/fireplace.mp3' },
    { id: 'whitenoise', name: 'White Noise', icon: Users, url: '/sounds/whitenoise.mp3' },
  ],
  music: [
    { id: 'lofi', name: 'Lo-Fi Beats', icon: Music, url: '/sounds/lofi.mp3' },
    { id: 'classical', name: 'Classical', icon: Music, url: '/sounds/classical.mp3' },
    { id: 'ambient', name: 'Ambient', icon: Music, url: '/sounds/ambient.mp3' },
  ],
};

export default function SoundControls() {
  const { isPremium, soundEnabled, setSoundEnabled, currentSound, setCurrentSound } = usePomodoroTimer();
  const [volume, setVolumeState] = useState(70);
  const [activeCategory, setActiveCategory] = useState('nature');
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Check premium status
  const checkPremium = useCallback(async () => {
    return isPremium;
  }, [isPremium]);

  const { data: premiumStatus } = useVisibilityAwareLoading(checkPremium, {
    refreshOnVisibility: true
  });

  // Initialize audio on component mount
  useEffect(() => {
    // If sound is enabled and we have a current sound, play it
    if (soundEnabled && currentSound) {
      const soundItem = [...SOUNDS.nature, ...SOUNDS.ambient, ...SOUNDS.music]
        .find(sound => sound.id === currentSound);
      
      if (soundItem) {
        playSound(soundItem.url, volume / 100);
      }
    } else {
      // Otherwise pause the audio
      stopSound();
    }
  }, [soundEnabled, currentSound, volume]);

  // Toggle sound on/off
  const toggleSound = () => {
    if (!isPremium) return;
    
    if (soundEnabled) {
      setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      // If no sound is selected, default to the first one
      if (!currentSound) {
        setCurrentSound(SOUNDS.nature[0].id);
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolumeState(newVolume);
    setVolume(newVolume / 100);
  };
  
  // Select a sound
  const selectSound = (soundId: string) => {
    if (!isPremium) return;
    
    setCurrentSound(soundId);
    setSoundEnabled(true);
  };

  if (!premiumStatus) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Premium Sounds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Upgrade to Premium to access ambient sounds and music</p>
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Ambient Sounds</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSound}
              className={!soundEnabled ? "text-muted-foreground" : ""}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </Button>
            <div className="w-32">
              <Slider
                disabled={!soundEnabled}
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category tabs */}
        <div className="flex mb-4 border-b border-accent-foreground">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none border-b-2 ${activeCategory === 'nature' ? 'border-secondary-foreground' : 'border-transparent'}`}
            onClick={() => setActiveCategory('nature')}
          >
            Nature
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none border-b-2 ${activeCategory === 'ambient' ? 'border-secondary-foreground' : 'border-transparent'}`}
            onClick={() => setActiveCategory('ambient')}
          >
            Ambient
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none border-b-2 ${activeCategory === 'music' ? 'border-secondary-foreground' : 'border-transparent'}`}
            onClick={() => setActiveCategory('music')}
          >
            Music
          </Button>
        </div>
        
        {/* Sound options */}
        <div className="grid grid-cols-3 gap-2">
          {SOUNDS[activeCategory as keyof typeof SOUNDS].map((sound) => {
            const Icon = sound.icon;
            const isActive = currentSound === sound.id && soundEnabled;
            
            return (
              <Button
                key={sound.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`flex flex-col h-auto py-3 gap-1 ${isDarkMode && !isActive ? 'border-gray-700 hover:bg-gray-800' : ''}`}
                onClick={() => selectSound(sound.id)}
              >
                <Icon size={18} className={isDarkMode && !isActive ? 'text-gray-300' : ''} />
                <span className={`text-xs ${isDarkMode && !isActive ? 'text-gray-300' : ''}`}>{sound.name}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}