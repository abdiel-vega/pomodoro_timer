'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { testNotifications } from '@/utils/notifications';
import { Sparkles } from 'lucide-react';
import { PlayIcon, PauseIcon, RotateCcwIcon, BrainIcon, CoffeeIcon, CupSodaIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

import zenAnimationData from '../../public/animations/zen-animation.json';
import pulseAnimationData from '../../public/animations/pulse-animation.json';
import particlesAnimationData from '../../public/animations/particles-animation.json';


// Animation variants
const ANIMATIONS = {
  zenCircles: 'zenCircles',
  wave: 'wave',
  pulse: 'pulse',
  particles: 'particles',
  breathing: 'breathing',
};

export default function EnhancedTimer() {
  const {
    timerState,
    timerType,
    timeRemaining,
    completedPomodoros,
    currentCyclePosition,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    changeTimerType,
    currentTask,
    isPremium,
    deepFocusMode,
    animationType,
    refreshUserSettings,
  } = usePomodoroTimer();

  const { theme } = useTheme();
  const [isCheckingPremium, setIsCheckingPremium] = useState(true);

  // Animation references
  const lottieRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Calculate total time based on timer type
  const totalTime = timerType === 'work'
    ? settings.workDuration * 60
    : timerType === 'short_break'
      ? settings.shortBreakDuration * 60
      : settings.longBreakDuration * 60;

  // Calculate progress percentage
  const progressPercentage = ((totalTime - timeRemaining) / totalTime) * 100;

  // Format time remaining
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get timer title
  const getTimerTitle = () => {
    switch (timerType) {
      case 'work':
        return 'Focus Time';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      default:
        return 'Pomodoro Timer';
    }
  };

  // Get background color based on timer type and theme
  const getBackgroundColor = () => {
    switch (timerType) {
      case 'work':
        return 'bg-card';
      case 'short_break':
        return 'bg-primary';
      case 'long_break':
        return 'bg-secondary';
      default:
        return 'bg-card';
    }
  };
  
  // Get circle stroke color for the timer
  const getCircleColor = () => {
    switch (timerType) {
      case 'work':
        return 'hsl(var(--accent-foreground))';
      case 'short_break':
        return 'hsl(var(--accent-foreground))';
      case 'long_break':
        return 'hsl(var(--accent-foreground))';
      default:
        return 'hsl(var(--accent-foreground))';
    }
  };  
  
  // Get progress bar colors
  const getProgressBarColors = () => {
    if (timerType === 'work') {
      return {
        bg: 'bg-muted',
        fg: 'bg-accent-foreground'
      };
    } else if (timerType === 'short_break') {
      return {
        bg: 'bg-primary-foreground',
        fg: 'bg-accent-foreground'
      };
    } else {
      return {
        bg: 'bg-secondary-foreground',
        fg: 'bg-accent-foreground'
      };
    }
  };

  // Determine which animation to render and its properties
  const getLottieAnimation = () => {
    // Base container styles shared by all animations
    const baseStyles = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      opacity: timerState === 'running' ? 0.8 : 0.4,
      transition: 'opacity 0.5s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: '50%',
    } as React.CSSProperties;
    
    // For canvas-based animations that we're still keeping (wave and breathing)
    if (animationType === 'wave' || animationType === 'breathing') {
      return (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full rounded-full"
          style={{ zIndex: 0 }}
        />
      );
    }
    
    // Handle the Lottie animations
    if (animationType === 'zenCircles') {
      // Zen animation
      const zenStyles = {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        overflow: 'hidden',
      } as React.CSSProperties;
      
      return (
        <div style={baseStyles}>
          <Lottie
            animationData={zenAnimationData}
            loop={true}
            autoplay={true}
            style={zenStyles}
            className='lottie-zen'
            rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice',
            }}
          />
        </div>
      );
    } else if (animationType === 'pulse') {
      // Pulse animation
      const pulseStyles = {
        width: '154%',
        height: '154%',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        overflow: 'hidden',
      } as React.CSSProperties;
      
      return (
        <div style={baseStyles}>
          <Lottie
            animationData={pulseAnimationData}
            loop={true}
            autoplay={true}
            style={pulseStyles}
            className="lottie-pulse"
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid slice',
            }}
          />
        </div>
      );
    } else if (animationType === 'particles') {
      // Particles animation
      const particlesStyles = {
        width: '125%',
        height: '125%',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        overflow: 'hidden',
      } as React.CSSProperties;
      
      return (
        <div style={baseStyles}>
          <Lottie
            animationData={particlesAnimationData}
            loop={true}
            autoplay={true}
            style={particlesStyles}
            className='lottie-particles'
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid slice',
            }}
          />
        </div>
      );
    }
    
    // Default to no animation
    return null;
  };

  // Handle canvas-based animations for wave and breathing animations
  useEffect(() => {
    if (!canvasRef.current || !isPremium || 
        (animationType !== 'wave' && animationType !== 'breathing')) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Animation function
    const animate = () => {
      if (animationType === 'wave') {
        drawWave(ctx, canvas.width, canvas.height);
      } else if (animationType === 'breathing') {
        drawBreathing(ctx, canvas.width, canvas.height);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Wave animation
    const drawWave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      
      const amplitude = 20; // Wave height
      const frequency = 0.02; // Wave density
      const timeOffset = Date.now() * 0.001; // Time-based animation
      
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      
      for (let x = 0; x < width; x++) {
        const y = Math.sin(x * frequency + timeOffset) * amplitude + height / 2;
        ctx.lineTo(x, y);
      }
      
      // Complete the wave by drawing to bottom corners
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      
      // Use the CSS variables directly
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--animation-primary');
      const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--animation-secondary');
      
      // Create gradient with theme colors
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, secondaryColor);
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    // Breathing animation
    const drawBreathing = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const now = Date.now() * 0.001;
      
      // Breathing pattern with a slower, natural rhythm
      const breathCycle = (Math.sin(now * 0.5) + 1) / 2; // 0 to 1 range
      
      // Size oscillates between 40% and 75% of container
      const minSize = Math.min(width, height) * 0.4;
      const maxSize = Math.min(width, height) * 0.75;
      const currentSize = minSize + breathCycle * (maxSize - minSize);
      
      // Use the CSS variables directly
      const primaryColorHsl = getComputedStyle(document.documentElement).getPropertyValue('--animation-primary').trim();
      const secondaryColorHsl = getComputedStyle(document.documentElement).getPropertyValue('--animation-secondary').trim();

      // Define opacity for breathing animation
      const primaryOpacity = 0.6;  // Adjust this value as needed (0.0 to 1.0)
      const secondaryOpacity = 0.4;  // Adjust this value as needed (0.0 to 1.0)

      // Convert HSL to HSLA by adding opacity
      const primaryColorWithOpacity = primaryColorHsl.replace('hsl', 'hsla').replace(')', `, ${primaryOpacity})`);
      const secondaryColorWithOpacity = secondaryColorHsl.replace('hsl', 'hsla').replace(')', `, ${secondaryOpacity})`);
      
      // Draw multiple concentric circles for breathing visualization
      const circleCount = 4;
      for (let i = 0; i < circleCount; i++) {
        const ratio = 1 - (i / circleCount);
        const radius = currentSize * ratio;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        
        // Alternate between primary and secondary colors
        ctx.fillStyle = i % 2 === 0 ? primaryColorWithOpacity : secondaryColorWithOpacity;
        ctx.fill();
      }
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationType, isPremium, timerState, timerType]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    useEffect(() => {
      if (!isPremium) return;
      
      // Get the CSS variables based on timer type and current theme
      const getAnimationColors = () => {
        // Get CSS custom properties based on current timer type
        if (timerType === 'work') {
          return {
            primary: 'var(--muted)',
            secondary: 'var(--accent-foreground)',
            background: 'var(--background)'
          };
        } else if (timerType === 'short_break') {
          return {
            primary: 'var(--primary)',
            secondary: 'var(--primary-foreground)',
            background: 'var(--background)'
          };
        } else { // long_break
          return {
            primary: 'var(--secondary)',
            secondary: 'var(--secondary-foreground)',
            background: 'var(--background)'
          };
        }
      };
    
      // Get colors based on current timer type and theme
      const colors = getAnimationColors();
      
      // Update CSS variables
      document.documentElement.style.setProperty('--animation-primary', `hsl(${colors.primary})`);
      document.documentElement.style.setProperty('--animation-secondary', `hsl(${colors.secondary})`);
      document.documentElement.style.setProperty('--animation-background', `hsl(${colors.background})`);
      
    }, [timerType, theme, isPremium]);
    
    useEffect(() => {
      // Create style element for animation colors if it doesn't exist
      if (!document.getElementById('animation-colors-style')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'animation-colors-style';
        document.head.appendChild(styleElement);
      }
      
      // Update the style content based on the current timer type and theme
      const styleElement = document.getElementById('animation-colors-style');
      if (styleElement) {
        styleElement.textContent = `
          .lottie-zen svg path, .lottie-zen svg circle {
            fill: var(--animation-primary) !important;
            stroke: var(--animation-secondary) !important;
          }
          .lottie-pulse svg path, .lottie-pulse svg circle {
            fill: var(--animation-primary) !important;
            stroke: var(--animation-secondary) !important;
          }
          .lottie-particles svg path, .lottie-particles svg circle {
            fill: var(--animation-secondary) !important;
            stroke: var(--animation-primary) !important;
          }
        `;
      }
      
      return () => {
        // Clean up when component unmounts
        const styleElement = document.getElementById('animation-colors-style');
        if (styleElement) {
          styleElement.textContent = '';
        }
      };
    }, [animationType, timerType, theme]);    

  const progressColors = getProgressBarColors();

  // Show loading state while checking premium
  if (isCheckingPremium) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 timer-container">
        <CardContent className="pt-6 flex justify-center items-center" style={{ height: "400px" }}>
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg border-0 timer-container ${getBackgroundColor()}`}>
      <CardContent className="pt-6 relative">
        <div className="flex flex-col items-center space-y-8">
          {/* Timer Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-accent-foreground">{getTimerTitle()}</h2>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-sm text-foreground">
                Cycles: {currentCyclePosition}/{settings.longBreakInterval}
              </p>
              <p className="text-xs text-foreground">
                Total Pomodoros: {completedPomodoros}
              </p>
              {currentTask && (
                <div className="mt-2">
                   <Badge 
                    variant="outline" 
                    className="text-xs py-1 px-2 border-accent-foreground text-accent-foreground"
                  >
                    Working on: {currentTask.title}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* Timer Display */}
          <div className="w-48 h-48 rounded-full flex items-center justify-center relative">
            {isPremium && getLottieAnimation()}
            <span className="text-4xl font-bold z-10 text-accent-foreground">{formatTime(timeRemaining)}</span>
            <div className="absolute -top-2 -right-2 -bottom-2 -left-2 z-5">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="rotate-[-90deg]">
                {/* Background circle - appears first in the SVG, so it's at the bottom */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  className={`
                    ${timerType === 'work' 
                      ? 'stroke-muted' 
                      : timerType === 'short_break' 
                        ? 'stroke-primary-foreground' 
                        : 'stroke-secondary-foreground'
                    }
                  `}
                  strokeWidth="4"
                />
                
                {/* Progress circle - appears second, so it's on top */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={getCircleColor()}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {timerState === 'idle' && (
              <Button onClick={startTimer} size="lg" variant="outline" className="rounded-full w-12 h-12 p-0">
                <PlayIcon className="h-6 w-6 text-accent-foreground" />
              </Button>
            )}
            
            {timerState === 'running' && (
              <Button onClick={pauseTimer} size="lg" variant="outline" className="rounded-full w-12 h-12 p-0">
                <PauseIcon className="h-6 w-6 text-accent-foreground" />
              </Button>
            )}
            
            {timerState === 'paused' && (
              <Button onClick={resumeTimer} size="lg" variant="outline" className="rounded-full w-12 h-12 p-0">
                <PlayIcon className="h-6 w-6 text-accent-foreground" />
              </Button>
            )}
            
            <Button 
              onClick={resetTimer} 
              size="lg"
              variant="outline" 
              className="rounded-full w-12 h-12 p-0"
            >
              <RotateCcwIcon className="h-5 w-5 text-accent-foreground" />
            </Button>
            <Button 
            variant="outline" 
            size="sm" 
            onClick={testNotifications} 
            className="mt-2"
          >
            Test Notification
          </Button>
          </div>
          
          {/* Timer Type Selection */}
          <div className="flex items-center justify-center gap-2 w-full">
            <Button 
              onClick={() => changeTimerType('work')} 
              variant={timerType === 'work' ? 'outline' : 'default'}
              className="flex items-center gap-1"
              size="sm"
            >
              <BrainIcon className="h-4 w-4 text-accent-foreground" />
              Focus Time
            </Button>
            <Button 
              onClick={() => changeTimerType('short_break')} 
              variant={timerType === 'short_break' ? 'outline' : 'default'}
              className="flex items-center gap-1"
              size="sm"
            >
              <CoffeeIcon className="h-4 w-4 text-accent-foreground" />
              Short Break
            </Button>
            <Button 
              onClick={() => changeTimerType('long_break')} 
              variant={timerType === 'long_break' ? 'outline' : 'default'}
              className="flex items-center gap-1"
              size="sm"
            >
              <CupSodaIcon className="h-4 w-4 text-accent-foreground" />
              Long Break
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full">
            <div className={`w-full ${progressColors.bg} rounded-full h-2`}>
              <div 
                className={`${progressColors.fg} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {!isPremium && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <p className="font-medium">Unlock animations and more premium features</p>
              </div>
              <p className="mt-1 text-xs">
                Purchase premium for animated timers, ambient sounds, and advanced analytics.
              </p>
              <Button 
                size="sm"
                className="mt-2 w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                onClick={() => window.location.href = '/premium'}
              >
                Upgrade to Premium
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
