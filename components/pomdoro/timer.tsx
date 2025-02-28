/*

timer component

*/
// components/pomodoro/Timer.tsx
'use client';

import React from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayIcon, PauseIcon, RotateCcwIcon, SkipForwardIcon } from 'lucide-react';

export default function Timer() {
  const {
    timerState,
    timerType,
    timeRemaining,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    currentTask
  } = usePomodoroTimer();

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

  // Get background color based on timer type
  const getBackgroundColor = () => {
    switch (timerType) {
      case 'work':
        return 'bg-primary/5';
      case 'short_break':
        return 'bg-green-500/5';
      case 'long_break':
        return 'bg-blue-500/5';
      default:
        return 'bg-background';
    }
  };

  // Get progress color based on timer type
  const getProgressColor = () => {
    switch (timerType) {
      case 'work':
        return 'bg-primary';
      case 'short_break':
        return 'bg-green-500';
      case 'long_break':
        return 'bg-blue-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg ${getBackgroundColor()}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-8">
          {/* Timer Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold">{getTimerTitle()}</h2>
            {currentTask && (
              <p className="text-sm text-muted-foreground mt-1">
                Working on: {currentTask.title}
              </p>
            )}
          </div>
          
          {/* Timer Display */}
          <div className="w-48 h-48 rounded-full border-8 border-muted flex items-center justify-center relative">
            <span className="text-4xl font-bold">{formatTime(timeRemaining)}</span>
            <div className="absolute -top-2 -right-2 -bottom-2 -left-2">
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
                  stroke={timerType === 'work' ? 'hsl(var(--primary))' : timerType === 'short_break' ? '#22c55e' : '#3b82f6'}
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
            
            <Button 
              onClick={skipTimer} 
              size="lg"
              variant="outline" 
              className="rounded-full w-12 h-12 p-0"
            >
              <SkipForwardIcon className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full">
            <Progress 
              value={progressPercentage} 
              className={`h-2 ${getProgressColor()}`} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}