/*

timer component

*/
'use client';

import React from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayIcon, PauseIcon, RotateCcwIcon, SkipForwardIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  // Get circle background color based on timer type
  const getCircleBackgroundColor = () => {
    switch (timerType) {
      case 'work':
        return '#CDCDCD';
      case 'short_break':
        return '#DAB8FF';
      case 'long_break':
        return '#B7C7F2';
      default:
        return '#CDCDCD';
    }
  };

  // Get progress color based on timer type
  const getProgressColor = () => {
    switch (timerType) {
      case 'work':
        return '#000000';
      case 'short_break':
        return '#D58DFF';
      case 'long_break':
        return '#83A4FF';
      default:
        return '#000000';
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg ${getBackgroundColor()}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-8">
          {/* Timer Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold">{getTimerTitle()}</h2>
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
            <span className="text-4xl font-bold">{formatTime(timeRemaining)}</span>
            <div className="absolute -top-2 -right-2 -bottom-2 -left-2">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="rotate-[-90deg]">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={getCircleBackgroundColor()}
                  strokeWidth="4"
                  strokeOpacity="1"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={getProgressColor()}
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
            <div className="h-2 w-full bg-opacity-100 rounded-full overflow-hidden" style={{ backgroundColor: getCircleBackgroundColor() }}>
              <div 
                className="h-full transition-all duration-1000 rounded-full" 
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: getProgressColor()
                }} 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}