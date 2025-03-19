// components/pomodoro/enhanced-timer.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { PlayIcon, PauseIcon, RotateCcwIcon, BrainIcon, CoffeeIcon, CupSodaIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Animation variants
const ANIMATIONS = {
  bubbles: 'bubbles',
  wave: 'wave',
  pulse: 'pulse',
  forest: 'forest',
  space: 'space',
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
  } = usePomodoroTimer();

  // Animation state
  const [animationType, setAnimationType] = React.useState(ANIMATIONS.pulse);
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

  // Bubble animation
  const drawBubbles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    const bubbles = Math.floor(width / 20); // Number of bubbles based on width
    
    for (let i = 0; i < bubbles; i++) {
      const x = Math.random() * width;
      const y = height - (timeRemaining % 60) * (height / 60);
      const radius = Math.random() * 10 + 5;
      const opacity = Math.random() * 0.5 + 0.2;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(66, 135, 245, ${opacity})`;
      ctx.fill();
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

  // Forest animation (trees growing with time)
  const drawForest = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const groundY = height * 0.8;
    const progress = progressPercentage / 100;
    
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGradient.addColorStop(0, '#87CEEB'); // Sky blue
    skyGradient.addColorStop(1, '#E0F7FA'); // Light blue
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, groundY);
    
    // Draw ground
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.fillRect(0, groundY, width, height - groundY);
    
    // Draw grass
    ctx.fillStyle = '#228B22'; // Forest green
    ctx.fillRect(0, groundY - 5, width, 10);
    
    // Number of trees based on canvas width
    const numTrees = Math.floor(width / 40);
    const treeHeight = height * 0.3 * progress; // Trees grow with progress
    
    for (let i = 0; i < numTrees; i++) {
      const x = (i + 0.5) * (width / numTrees);
      
      // Draw trunk
      ctx.fillStyle = '#8B4513'; // Brown
      ctx.fillRect(x - 5, groundY - treeHeight, 10, treeHeight);
      
      // Draw foliage (triangles)
      ctx.beginPath();
      ctx.moveTo(x, groundY - treeHeight - 40 * progress);
      ctx.lineTo(x - 20 * progress, groundY - treeHeight);
      ctx.lineTo(x + 20 * progress, groundY - treeHeight);
      ctx.closePath();
      ctx.fillStyle = '#006400'; // Dark green
      ctx.fill();
      
      // Draw second layer of foliage
      ctx.beginPath();
      ctx.moveTo(x, groundY - treeHeight - 70 * progress);
      ctx.lineTo(x - 15 * progress, groundY - treeHeight - 30 * progress);
      ctx.lineTo(x + 15 * progress, groundY - treeHeight - 30 * progress);
      ctx.closePath();
      ctx.fillStyle = '#228B22'; // Forest green
      ctx.fill();
    }
    
    // Draw sun
    const sunRadius = 30;
    ctx.beginPath();
    ctx.arc(width - 50, 50, sunRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.fill();
    
    // Draw sun rays
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x1 = width - 50 + Math.cos(angle) * sunRadius;
      const y1 = 50 + Math.sin(angle) * sunRadius;
      const x2 = width - 50 + Math.cos(angle) * (sunRadius + 15);
      const y2 = 50 + Math.sin(angle) * (sunRadius + 15);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Space animation
  const drawSpace = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    // Draw space background
    ctx.fillStyle = '#000033'; // Dark blue
    ctx.fillRect(0, 0, width, height);
    
    // Draw stars
    const numStars = 100;
    const timeOffset = Date.now() * 0.001;
    
    for (let i = 0; i < numStars; i++) {
      const x = (i * 17) % width;
      const y = (i * 23) % height;
      const size = Math.sin(timeOffset + i * 0.1) * 1 + 2;
      const opacity = Math.sin(timeOffset + i * 0.1) * 0.3 + 0.7;
      
      ctx.beginPath();
      ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fill();
    }
    
    // Draw planet (changes size based on progress)
    const centerX = width / 2;
    const centerY = height / 2;
    const planetRadius = Math.min(width, height) * 0.2 * (1 - progressPercentage / 100);
    
    // Planet body
    ctx.beginPath();
    ctx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
    
    // Planet color based on timer type
    let planetColor;
    if (timerType === 'work') {
      planetColor = '#4A2C40'; // Deep purple
    } else if (timerType === 'short_break') {
      planetColor = '#4682B4'; // Steel blue
    } else {
      planetColor = '#228B22'; // Forest green
    }
    
    ctx.fillStyle = planetColor;
    ctx.fill();
    
    // Draw planet details (rings or craters)
    if (timerType === 'work') {
      // Draw craters for work timer
      for (let i = 0; i < 5; i++) {
        const craterX = centerX + Math.cos(i * 1.5) * planetRadius * 0.6;
        const craterY = centerY + Math.sin(i * 1.5) * planetRadius * 0.6;
        const craterSize = planetRadius * 0.2;
        
        ctx.beginPath();
        ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
        ctx.fillStyle = '#3A1F30';
        ctx.fill();
      }
    } else {
      // Draw rings for break timers
      ctx.beginPath();
      ctx.ellipse(
        centerX, 
        centerY, 
        planetRadius * 1.5, 
        planetRadius * 0.5, 
        Math.PI / 4, 
        0, 
        Math.PI * 2
      );
      ctx.strokeStyle = timerType === 'short_break' ? '#ADD8E6' : '#90EE90';
      ctx.lineWidth = 3;
      ctx.stroke();
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
        case ANIMATIONS.bubbles:
          drawBubbles(ctx, canvas.width, canvas.height);
          break;
        case ANIMATIONS.wave:
          drawWave(ctx, canvas.width, canvas.height);
          break;
        case ANIMATIONS.pulse:
          drawPulse(ctx, canvas.width, canvas.height);
          break;
        case ANIMATIONS.forest:
          drawForest(ctx, canvas.width, canvas.height);
          break;
        case ANIMATIONS.space:
          drawSpace(ctx, canvas.width, canvas.height);
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
        {isPremium && (
          <div className="absolute top-0 right-0 m-2 z-10 flex gap-2">
            <div className="flex flex-wrap gap-1">
              {Object.values(ANIMATIONS).map((animation) => (
                <Button
                  key={animation}
                  size="sm"
                  variant={animationType === animation ? "default" : "outline"}
                  className="h-8 text-xs px-2"
                  onClick={() => setAnimationType(animation)}
                >
                  {animation}
                </Button>
              ))}
            </div>
          </div>
        )}
        
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