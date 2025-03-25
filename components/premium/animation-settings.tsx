'use client';

import { useState, useEffect } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PaintbrushIcon, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

// Animation display names
const ANIMATION_NAMES = {
  zenCircles: 'Zen',
  pulse: 'Pulse',
  particles: 'Particles',
  wave: 'Wave',
  breathing: 'Breathing',
};

// Predefined color schemes
const COLOR_SCHEMES = {
  grayscale: {
    name: 'Grayscale',
    primary: '#808080',
    secondary: '#D3D3D3',
    background: '#F0F0F0',
  },
  blueOcean: {
    name: 'Blue Ocean',
    primary: '#1E90FF',
    secondary: '#00BFFF',
    background: '#F0F8FF',
  },
  purpleDream: {
    name: 'Purple Dream',
    primary: '#8A2BE2',
    secondary: '#BA55D3',
    background: '#F8F4FF',
  },
  sunsetOrange: {
    name: 'Sunset Orange',
    primary: '#FF4500',
    secondary: '#FF8C00',
    background: '#FFF5F0',
  },
  mintGreen: {
    name: 'Mint Green',
    primary: '#3CB371',
    secondary: '#98FB98',
    background: '#F0FFF4',
  },
};

// Dark mode color schemes
const DARK_COLOR_SCHEMES = {
  grayscale: {
    name: 'Grayscale',
    primary: '#A0A0A0',
    secondary: '#505050',
    background: '#303030',
  },
  blueOcean: {
    name: 'Blue Ocean',
    primary: '#4682B4',
    secondary: '#104E8B',
    background: '#0C2D48',
  },
  purpleDream: {
    name: 'Purple Dream',
    primary: '#9370DB',
    secondary: '#483D8B',
    background: '#2A1B3D',
  },
  sunsetOrange: {
    name: 'Sunset Orange',
    primary: '#FF6347',
    secondary: '#8B3A2A',
    background: '#3A1F1D',
  },
  mintGreen: {
    name: 'Mint Green',
    primary: '#66CDAA',
    secondary: '#2E8B57',
    background: '#1D3B2A',
  },
};

export default function AnimationSettings() {
  const { isPremium, animationType, setAnimationType } = usePomodoroTimer();
  const [selectedColorScheme, setSelectedColorScheme] = useState('grayscale');
  const [customColors, setCustomColors] = useState({
    primary: '#000000',
    secondary: '#666666',
    background: '#f0f0f0',
  });
  const [colorMode, setColorMode] = useState<'preset' | 'custom'>('preset');
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // On component mount, load saved color preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedColorScheme = localStorage.getItem('animationColorScheme');
      const savedCustomColors = localStorage.getItem('animationCustomColors');
      const savedColorMode = localStorage.getItem('animationColorMode');

      if (savedColorScheme) {
        setSelectedColorScheme(savedColorScheme);
      }
      
      if (savedCustomColors) {
        try {
          setCustomColors(JSON.parse(savedCustomColors));
        } catch (e) {
          console.error('Failed to parse saved custom colors:', e);
        }
      }
      
      if (savedColorMode) {
        setColorMode(savedColorMode as 'preset' | 'custom');
      }
      
      // Apply saved colors
      applyAnimationColors();
    }
  }, []);

  // Function to apply animation colors to CSS variables
  const applyAnimationColors = () => {
    if (!isPremium) return;
    
    let colors;
    
    if (colorMode === 'preset') {
      colors = isDarkMode 
        ? DARK_COLOR_SCHEMES[selectedColorScheme as keyof typeof DARK_COLOR_SCHEMES]
        : COLOR_SCHEMES[selectedColorScheme as keyof typeof COLOR_SCHEMES];
    } else {
      colors = customColors;
    }
    
    if (colors) {
      document.documentElement.style.setProperty('--animation-primary', colors.primary);
      document.documentElement.style.setProperty('--animation-secondary', colors.secondary);
      document.documentElement.style.setProperty('--animation-background', colors.background);
    }
  };

  // Handle changing animation type
  const handleAnimationChange = (type: string) => {
    setAnimationType(type);
    toast.success(`Animation set to ${ANIMATION_NAMES[type as keyof typeof ANIMATION_NAMES]}`);
  };

  // Handle changing color scheme
  const handleColorSchemeChange = (scheme: string) => {
    setSelectedColorScheme(scheme);
    localStorage.setItem('animationColorScheme', scheme);
    applyAnimationColors();
    toast.success(`Color scheme updated`);
  };

  // Handle custom color change
  const handleCustomColorChange = (colorType: 'primary' | 'secondary' | 'background', value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorType]: value
    }));
    
    // Save to localStorage
    localStorage.setItem('animationCustomColors', JSON.stringify({
      ...customColors,
      [colorType]: value
    }));
    
    applyAnimationColors();
  };

  // Switch between preset and custom colors
  const handleColorModeChange = (mode: 'preset' | 'custom') => {
    setColorMode(mode);
    localStorage.setItem('animationColorMode', mode);
    applyAnimationColors();
  };

  // Apply animation colors whenever relevant state changes
  useEffect(() => {
    applyAnimationColors();
  }, [selectedColorScheme, customColors, colorMode, theme]);

  if (!isPremium) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Animation Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Upgrade to Premium to customize timer animations</p>
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
          <PaintbrushIcon size={18} />
          Animation Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Animation Type Selection */}
          </div>
          
          {/* Color Mode Selection */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Animation Colors</h3>
            <Tabs value={colorMode} onValueChange={value => handleColorModeChange(value as 'preset' | 'custom')}>
              <TabsList className="mb-4">
                <TabsTrigger value="preset">Preset Colors</TabsTrigger>
                <TabsTrigger value="custom">Custom Colors</TabsTrigger>
              </TabsList>
              
              {/* Preset Color Schemes */}
              {colorMode === 'preset' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(isDarkMode ? DARK_COLOR_SCHEMES : COLOR_SCHEMES).map(([key, scheme]) => (
                    <div
                      key={key}
                      className={`flex flex-col items-center p-3 cursor-pointer rounded-md border transition-all hover:shadow-md ${
                        selectedColorScheme === key ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleColorSchemeChange(key)}
                    >
                      <div className="flex mb-2">
                        <div 
                          className="w-4 h-8 rounded-l-sm" 
                          style={{ backgroundColor: scheme.primary }}
                        />
                        <div 
                          className="w-4 h-8" 
                          style={{ backgroundColor: scheme.secondary }}
                        />
                        <div 
                          className="w-4 h-8 rounded-r-sm" 
                          style={{ backgroundColor: scheme.background }}
                        />
                      </div>
                      <span className="text-xs">{scheme.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Custom Color Selection */}
              {colorMode === 'custom' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor" className="text-sm">
                      Color Picker
                    </Label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="primaryColor"
                        type="color"
                        value={customColors.primary}
                        onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                        className="h-8 w-10 rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={customColors.primary}
                        onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                        className="w-24 h-8"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Tabs>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded-md">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-yellow-500" />
              Animation colors will be applied the next time you start a timer.
            </span>
          </div>
      </CardContent>
    </Card>
  );
}