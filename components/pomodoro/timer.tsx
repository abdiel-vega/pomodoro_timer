/*

timer component

*/
'use client';

import React from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayIcon, PauseIcon, RotateCcwIcon, BrainIcon, CoffeeIcon, CupSodaIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

export default function Timer() {
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
    currentTask
  } = usePomodoroTimer();
  
  const { theme } = useTheme();

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

  const progressColors = getProgressBarColors();

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg border-0 ${getBackgroundColor()}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-8">
          {/* Timer Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-accent-foreground">{getTimerTitle()}</h2>
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
            <span className="text-4xl font-bold text-accent-foreground">{formatTime(timeRemaining)}</span>
              <div className="absolute -top-2 -right-2 -bottom-2 -left-2" style={{ zIndex: 5, opacity: 1 }}>
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
          </div>
          
          {/* Timer Type Selection */}
          <div className="flex items-center justify-center gap-2 w-full">
            <Button 
              onClick={() => changeTimerType('work')} 
              variant={timerType === 'work' ? 'outline' : 'default'}
              className="flex items-center gap-1"
              size="sm"
            >
              <BrainIcon className="h-4 w-4" />
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
          
          {/* Progress Bar - Using theme-aware colors */}
          <div className="w-full">
            <div className={`w-full ${progressColors.bg} rounded-full h-2`}>
              <div 
                className={`${progressColors.fg} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}