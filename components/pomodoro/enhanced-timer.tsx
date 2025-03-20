'use client';

import React, { useEffect, useRef } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { PlayIcon, PauseIcon, RotateCcwIcon, BrainIcon, CoffeeIcon, CupSodaIcon } from 'lucide-react';

// Animation variants - replaced spiral with breathing
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
    animationType
  } = usePomodoroTimer();

  // Animation state
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

  // Get circle stroke color for the timer
  const getCircleColor = () => {
    switch (timerType) {
      case 'work':
        return '#000000';
      case 'short_break':
        return '#8b5cf6'; // violet-500
      case 'long_break':
        return '#3b82f6'; // blue-500
      default:
        return 'hsl(var(--primary))';
    }
  };

  //  Zen Circles animation
  const drawZenCircles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    // Get color based on timer type
    let circleColor;
    if (timerType === 'work') {
      circleColor = "rgba(0, 0, 0, 0.2)"; // Black for work
    } else if (timerType === 'short_break') {
      circleColor = "rgba(139, 92, 246, 0.2)"; // Violet for short break
    } else {
      circleColor = "rgba(59, 130, 246, 0.2)"; // Blue for long break
    }
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Current time for animation
    const time = Date.now() * 0.001;
    
    // Draw multiple expanding circles
    const circleCount = 8; // Increased from 5 to 8 for smoother effect
    for (let i = 0; i < circleCount; i++) {
      // Calculate radius based on time
      // This creates circles that expand outward and repeat
      const phase = (time * 0.4 + i / circleCount) % 1;
      const radius = phase * Math.min(width, height) * 0.45;
      
      // Calculate opacity with a smoother fade-out curve
      // Using a more gradual fade with a cubic curve
      const opacity = 0.6 * Math.pow(1 - phase, 2);
      
      // Only draw if still somewhat visible
      if (opacity > 0.02) {
        // Draw the circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = circleColor.replace(')', `, ${opacity})`).replace('rgba', 'rgba');
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
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
    
    // Fill with gradient based on timer type
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (timerType === 'work') {
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    } else if (timerType === 'short_break') {
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.7)'); // violet
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.3)');
    } else {
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.7)'); // blue
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  // Pulse animation
  const drawPulse = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;
    
    // Calculate pulse radius based on timer state
    const pulseBase = Math.sin(Date.now() * 0.002) * 0.1 + 0.9;
    const pulseRadius = timerState === 'running' 
      ? maxRadius * pulseBase 
      : maxRadius * 0.9;
    
    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.1)';
    ctx.fill();
    
    // Draw pulse circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    
    // Color based on timer type
    let color;
    if (timerType === 'work') {
      color = 'rgba(0, 0, 0, 0.2)';
    } else if (timerType === 'short_break') {
      color = 'rgba(139, 92, 246, 0.2)'; // violet
    } else {
      color = 'rgba(59, 130, 246, 0.2)'; // blue
    }
    
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Particles animation
  const drawParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const now = Date.now() * 0.001;
    const particleCount = 40;
    
    // Get color based on timer type
    let particleColor;
    if (timerType === 'work') {
      particleColor = '#000000';
    } else if (timerType === 'short_break') {
      particleColor = '#8b5cf6'; // violet
    } else {
      particleColor = '#3b82f6'; // blue
    }
    
    for (let i = 0; i < particleCount; i++) {
      // Use sine functions to create flowing movement
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 0.5 + Math.sin(i * 5) * 0.3;
      const x = width/2 + Math.cos(angle + now * speed) * (width * 0.4);
      const y = height/2 + Math.sin(angle + now * speed) * (height * 0.4);
      const size = 1 + Math.sin(now * 2 + i) * 1;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = 0.6 + Math.sin(now + i) * 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  // Breathing animation
  const drawBreathing = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const now = Date.now() * 0.001;
    
    // Create a breathing pattern with a slower, more natural rhythm
    // Full cycle takes about 6 seconds (inhale 3s, exhale 3s)
    const breathCycle = (Math.sin(now * 0.5) + 1) / 2; // 0 to 1 range
    
    // Size oscillates between 40% and 75% of container
    const minSize = Math.min(width, height) * 0.4;
    const maxSize = Math.min(width, height) * 0.75;
    const currentSize = minSize + breathCycle * (maxSize - minSize);
    
    // Get color based on timer type
    let primaryColor, secondaryColor;
    if (timerType === 'work') {
      primaryColor = 'rgba(0, 0, 0, 0.3)';
      secondaryColor = 'rgba(0, 0, 0, 0.05)';
    } else if (timerType === 'short_break') {
      primaryColor = 'rgba(139, 92, 246, 0.3)'; // violet
      secondaryColor = 'rgba(139, 92, 246, 0.05)';
    } else {
      primaryColor = 'rgba(59, 130, 246, 0.3)'; // blue
      secondaryColor = 'rgba(59, 130, 246, 0.05)';
    }
    
    // Draw multiple concentric circles for breathing visualization
    const circleCount = 4;
    for (let i = 0; i < circleCount; i++) {
      const ratio = 1 - (i / circleCount);
      const radius = currentSize * ratio;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      
      // Alternate between primary and secondary colors
      ctx.fillStyle = i % 2 === 0 ? primaryColor : secondaryColor;
      ctx.fill();
    }
    
    // Add text hint about breathing if timer is running
    if (timerState === 'running') {
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = primaryColor;
    }
  };

  // Handle animation frames
  useEffect(() => {
    if (!canvasRef.current || !isPremium) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Animation function
    const animate = () => {
      switch (animationType) {
        case ANIMATIONS.zenCircles:
          drawZenCircles(ctx, canvas.width, canvas.height);
          break;
        case ANIMATIONS.wave:
          drawWave(ctx, canvas.width, canvas.height);
          break;
        case ANIMATIONS.pulse:
          drawPulse(ctx, canvas.width, canvas.height);
          break;
        case ANIMATIONS.particles:
          drawParticles(ctx, canvas.width, canvas.height);
          break;
        case ANIMATIONS.breathing:
          drawBreathing(ctx, canvas.width, canvas.height);
          break;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationType, isPremium, progressPercentage, timerState, timerType]);

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

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg ${timerType === 'work' ? 'bg-gray-100' : timerType === 'short_break' ? 'bg-violet-50' : 'bg-blue-50'}`}>
      <CardContent className="pt-6 relative">
        <div className="flex flex-col items-center space-y-8">
          {/* Timer Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{getTimerTitle()}</h2>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-sm text-muted-foreground">
                Cycles: {currentCyclePosition}/{settings.longBreakInterval}
              </p>
              <p className="text-xs text-muted-foreground">
                Total Pomodoros: {completedPomodoros}
              </p>
              {currentTask && (
                <div className="mt-2">
                   <Badge 
                    variant="outline" 
                    className="text-xs py-1 px-2 border-primary/50 text-primary"
                  >
                    Working on: {currentTask.title}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* Timer Display */}
          <div className="w-48 h-48 rounded-full border-8 border-muted flex items-center justify-center relative">
            {isPremium && (
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full rounded-full"
                style={{ zIndex: 0 }}
              />
            )}
            <span className="text-4xl font-bold z-10">{formatTime(timeRemaining)}</span>
            <div className="absolute -top-2 -right-2 -bottom-2 -left-2 z-5">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="rotate-[-90deg]">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeOpacity="0.1"
                />
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
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {timerState === 'idle' && (
              <Button onClick={startTimer} size="lg" className="rounded-full w-12 h-12 p-0">
                <PlayIcon className="h-6 w-6" />
              </Button>
            )}
            
            {timerState === 'running' && (
              <Button onClick={pauseTimer} size="lg" className="rounded-full w-12 h-12 p-0">
                <PauseIcon className="h-6 w-6" />
              </Button>
            )}
            
            {timerState === 'paused' && (
              <Button onClick={resumeTimer} size="lg" className="rounded-full w-12 h-12 p-0">
                <PlayIcon className="h-6 w-6" />
              </Button>
            )}
            
            <Button 
              onClick={resetTimer} 
              size="lg"
              variant="outline" 
              className="rounded-full w-12 h-12 p-0"
            >
              <RotateCcwIcon className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Timer Type Selection */}
          <div className="flex items-center justify-center gap-2 w-full">
            <Button 
              onClick={() => changeTimerType('work')} 
              variant={timerType === 'work' ? 'default' : 'outline'}
              className="flex items-center gap-1"
              size="sm"
            >
              <BrainIcon className="h-4 w-4" />
              Focus Time
            </Button>
            <Button 
              onClick={() => changeTimerType('short_break')} 
              variant={timerType === 'short_break' ? 'default' : 'outline'}
              className="flex items-center gap-1"
              size="sm"
            >
              <CoffeeIcon className="h-4 w-4" />
              Short Break
            </Button>
            <Button 
              onClick={() => changeTimerType('long_break')} 
              variant={timerType === 'long_break' ? 'default' : 'outline'}
              className="flex items-center gap-1"
              size="sm"
            >
              <CupSodaIcon className="h-4 w-4" />
              Long Break
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full">
            {timerType === 'work' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            )}
            {timerType === 'short_break' && (
              <div className="w-full bg-violet-300 rounded-full h-2">
                <div 
                  className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            )}
            {timerType === 'long_break' && (
              <div className="w-full bg-blue-300 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {!isPremium && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-700">
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