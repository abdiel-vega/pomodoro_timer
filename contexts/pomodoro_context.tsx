/*

pomodoro timer react context with local storage fallback

- manages timer state across the application
- uses local storage when supabase authentication is not available

*/
'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Task, UserSettings, Session } from '@/types/database';
import { 
  createSession, 
  completeSession, 
  getUserSettings, 
  updateUserSettings,
  updateTask,
  getTasks
} from '@/lib/supabase';
import { toast } from 'sonner';

// Default settings in case we can't load from database
const DEFAULT_SETTINGS: UserSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notifications: true
};

type TimerState = 'idle' | 'running' | 'paused' | 'finished';
type TimerType = 'work' | 'short_break' | 'long_break';

interface PomodoroContextType {
  // Timer state
  timerState: TimerState;
  timerType: TimerType;
  timeRemaining: number;
  completedPomodoros: number;
  currentCyclePosition: number; // Which pomodoro in the cycle (0-3 typically)
  
  // Settings
  settings: UserSettings;
  
  // Current task (if any)
  currentTask: Task | null;
  
  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  setCurrentTask: (task: Task | null) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  
  // Task update listener for UI synchronization
  refreshTasks: () => Promise<void>;
  tasksVersion: number; // A counter that increments whenever tasks are updated
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  // State
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timerType, setTimerType] = useState<TimerType>('work');
  const [timeRemaining, setTimeRemaining] = useState<number>(DEFAULT_SETTINGS.workDuration * 60);
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(0);
  const [currentCyclePosition, setCurrentCyclePosition] = useState<number>(0); // Start at position 0 (of 4)
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [tasksVersion, setTasksVersion] = useState<number>(0); // For triggering re-renders
  
  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionId = useRef<string | null>(null);
  
  // Function to refresh tasks - can be called by any component to get the latest task data
  const refreshTasks = useCallback(async () => {
    try {
      const taskData = await getTasks();
      
      // If we have a current task, update it with the latest data
      if (currentTask) {
        const updatedCurrentTask = taskData.find(task => task.id === currentTask.id);
        if (updatedCurrentTask) {
          setCurrentTask(updatedCurrentTask);
        }
      }
      
      // Increment the version to trigger UI updates
      setTasksVersion(prev => prev + 1);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    }
  }, [currentTask]);
  
  // Load user settings from database or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userSettings = await getUserSettings();
        if (userSettings) {
          setSettings(userSettings);
          // Update timer duration based on type
          if (timerType === 'work') {
            setTimeRemaining(userSettings.workDuration * 60);
          } else if (timerType === 'short_break') {
            setTimeRemaining(userSettings.shortBreakDuration * 60);
          } else {
            setTimeRemaining(userSettings.longBreakDuration * 60);
          }
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Timer countdown effect
  useEffect(() => {
    if (timerState === 'running') {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            clearInterval(timerRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState]);

  // Helper function to determine if we need a long break
  const needsLongBreak = () => {
    // Since we're now zero-based, we need a long break when position reaches (interval - 1)
    return currentCyclePosition >= settings.longBreakInterval - 1;
  };

  // Increment the completed pomodoros for current task
  const incrementTaskCompletedPomodoros = async () => {
    if (currentTask) {
      try {
        console.log('Incrementing completed pomodoros for task:', currentTask.title);
        
        // Create a new value for completed_pomodoros
        const newCompletedPomodoros = currentTask.completed_pomodoros + 1;
        
        // Log the update we're about to perform
        console.log(`Updating task ${currentTask.id}: completed_pomodoros from ${currentTask.completed_pomodoros} to ${newCompletedPomodoros}`);
        
        // Update the task in the database
        await updateTask(currentTask.id, {
          completed_pomodoros: newCompletedPomodoros
        });
        
        // Update the current task in local state
        setCurrentTask({
          ...currentTask,
          completed_pomodoros: newCompletedPomodoros
        });
        
        // Show a toast notification
        toast.success(`Completed a pomodoro for "${currentTask.title}" (${newCompletedPomodoros}/${currentTask.estimated_pomodoros})`);
        
        // Refresh all tasks to ensure UI consistency
        await refreshTasks();
        
        console.log('Task updated successfully');
      } catch (error) {
        console.error('Failed to update task completed pomodoros:', error);
        toast.error('Failed to update task pomodoros');
      }
    } else {
      console.log('No current task selected, skipping increment');
    }
  };
  
  // Handle timer complete
  const handleTimerComplete = async () => {
    setTimerState('finished');
    
    // If we have an active session, complete it
    if (currentSessionId.current) {
      try {
        await completeSession(currentSessionId.current);
        currentSessionId.current = null;
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    }
    
    // Send notification if enabled
    if (settings.notifications && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`${timerType === 'work' ? 'Work session' : 'Break'} completed!`, {
          body: timerType === 'work' 
            ? 'Time for a break!' 
            : 'Ready to get back to work?',
          icon: '/favicon.ico'
        });
      }
    }
    
    // Update state based on timer type
    if (timerType === 'work') {
      // Increment current task's completed pomodoros if this is a work session
      if (currentTask) {
        await incrementTaskCompletedPomodoros();
      }

      // Increment completed pomodoros counter (total count)
      setCompletedPomodoros(prev => prev + 1);
      
      // Increment current cycle position
      const newPosition = currentCyclePosition + 1;
      
      // Determine next break type based on cycle position
      const isLongBreak = newPosition >= settings.longBreakInterval;
      
      // Update cycle position
      setCurrentCyclePosition(newPosition);
      
      // Set the appropriate break type
      const nextType = isLongBreak ? 'long_break' : 'short_break';
      setTimerType(nextType);
      setTimeRemaining(nextType === 'long_break' 
        ? settings.longBreakDuration * 60 
        : settings.shortBreakDuration * 60);
        
      // Auto start break if enabled
      if (settings.autoStartBreaks) {
        setTimeout(() => startTimer(), 1500);
      }
    } else {
      // Coming from a break
      
      // If we just finished a long break, reset the cycle position to 0
      if (timerType === 'long_break') {
        setCurrentCyclePosition(0);
      }
      
      // Go back to work
      setTimerType('work');
      setTimeRemaining(settings.workDuration * 60);
      
      // Auto start pomodoro if enabled
      if (settings.autoStartPomodoros) {
        setTimeout(() => startTimer(), 1500);
      }
    }
  };
  
  // Start timer
  const startTimer = async () => {
    if (timerState === 'running') return;
    
    // Create a new session in the database
    try {
      const newSession: Omit<Session, 'id' | 'user_id' | 'started_at' | 'ended_at'> = {
        task_id: currentTask?.id || null,
        type: timerType,
        duration: timerType === 'work' 
          ? settings.workDuration * 60 
          : timerType === 'short_break' 
            ? settings.shortBreakDuration * 60 
            : settings.longBreakDuration * 60,
        is_completed: false
      };
      
      const session = await createSession(newSession);
      currentSessionId.current = session.id;
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    
    setTimerState('running');
  };
  
  // Pause timer
  const pauseTimer = () => {
    if (timerState === 'running') {
      setTimerState('paused');
    }
  };
  
  // Resume timer
  const resumeTimer = () => {
    if (timerState === 'paused') {
      setTimerState('running');
    }
  };
  
  // Reset timer
  const resetTimer = () => {
    setTimerState('idle');
    setTimeRemaining(
      timerType === 'work'
        ? settings.workDuration * 60
        : timerType === 'short_break'
          ? settings.shortBreakDuration * 60
          : settings.longBreakDuration * 60
    );
    
    // If we have an active session, abandon it
    if (currentSessionId.current) {
      currentSessionId.current = null;
    }
  };
  
  // Skip current timer
  const skipTimer = async () => {
    // If we have an active session, complete it
    if (currentSessionId.current) {
      try {
        await completeSession(currentSessionId.current);
        currentSessionId.current = null;
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    }
    
    // Fixed skip logic:
    if (timerType === 'work') {
      // When skipping a work session, increment current task's completed pomodoros
      if (currentTask) {
        await incrementTaskCompletedPomodoros();
      }

      // Count it as complete
      setCompletedPomodoros(prev => prev + 1);
      
      // Increment current cycle position
      const newPosition = currentCyclePosition + 1;
      
      // Determine if we need a long break
      const isLongBreak = newPosition >= settings.longBreakInterval;
      
      // Update cycle position
      setCurrentCyclePosition(newPosition);
      
      // Set the appropriate break type
      const nextType = isLongBreak ? 'long_break' : 'short_break';
      setTimerType(nextType);
      setTimeRemaining(nextType === 'long_break' 
        ? settings.longBreakDuration * 60 
        : settings.shortBreakDuration * 60);
    } else {
      // When skipping a break
      
      // If we're skipping a long break, reset the cycle position to 0
      if (timerType === 'long_break') {
        setCurrentCyclePosition(0);
      }
      
      // Go back to work
      setTimerType('work');
      setTimeRemaining(settings.workDuration * 60);
    }
    
    setTimerState('idle');
  };
  
  // Update settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // If timer is idle, update the time remaining
    if (timerState === 'idle') {
      if (timerType === 'work') {
        setTimeRemaining(updatedSettings.workDuration * 60);
      } else if (timerType === 'short_break') {
        setTimeRemaining(updatedSettings.shortBreakDuration * 60);
      } else {
        setTimeRemaining(updatedSettings.longBreakDuration * 60);
      }
    }
    
    // Save to database or localStorage
    try {
      await updateUserSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };
  
  // Request notification permission if enabled
  useEffect(() => {
    if (settings.notifications && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [settings.notifications]);
  
  const value = {
    timerState,
    timerType,
    timeRemaining,
    completedPomodoros,
    currentCyclePosition,
    settings,
    currentTask,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    setCurrentTask,
    updateSettings,
    refreshTasks,
    tasksVersion
  };
  
  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoroTimer() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoroTimer must be used within a PomodoroProvider');
  }
  return context;
}