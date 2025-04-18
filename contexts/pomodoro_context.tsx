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
import { useTheme } from 'next-themes';
import { createClient } from '@/utils/supabase/client';
import { recordFocusTime } from '@/app/actions';
import { useVisibilityAwareLoading } from '@/hooks/useVisibilityAwareLoading';

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
  changeTimerType: (type: TimerType) => void;
  setCurrentTask: (task: Task | null) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  
  // Task update listener for UI synchronization
  refreshTasks: () => Promise<void>;
  tasksVersion: number; // A counter that increments whenever tasks are updated
  
  // Premium features
  isPremium: boolean;
  refreshUserSettings: () => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  currentSound: string | null;
  setCurrentSound: (sound: string | null) => void;
  deepFocusMode: boolean;
  setDeepFocusMode: (enabled: boolean) => void;

  // Animation type for premium timer
  animationType: string;
  setAnimationType: (type: string) => void;
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
  
  // Premium features state
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [deepFocusMode, setDeepFocusMode] = useState<boolean>(false);
  const [animationType, setAnimationType] = useState<string>('pulse');

  const { theme } = useTheme();
  
  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionId = useRef<string | null>(null);
  const supabase = createClient();
  
  // Function to check premium status using the visibility-aware hook
  const checkPremiumStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('User authenticated, checking premium status');
        const { data } = await supabase
          .from('users')
          .select('is_premium, settings')
          .eq('id', user.id)
          .single();
          
        // If we have user settings, update them
        if (data?.settings) {
          setSettings(data.settings);
        }
        
        return !!data?.is_premium;
      }
      return false;
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }, [supabase]);

  // Use the visibility-aware loading hook for premium status
  const { 
    data: premiumStatus,
    refresh: refreshPremium
  } = useVisibilityAwareLoading(checkPremiumStatus);
  
  // Update premium status when the data changes
  useEffect(() => {
    setIsPremium(!!premiumStatus);
  }, [premiumStatus]);
  
  // Function to refresh user settings, including premium status
  const refreshUserSettings = useCallback(async () => {
    // Refresh premium status
    refreshPremium();
    
    try {
      // Get user settings
      const userSettings = await getUserSettings();
      if (userSettings) {
        setSettings(userSettings);
      }
    } catch (error) {
      console.error('Failed to refresh user settings:', error);
    }
  }, [refreshPremium]);  

  // Set up auth listener for premium status sync
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log('Auth state changed in context:', event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          refreshPremium();
        } else if (event === 'SIGNED_OUT') {
          setIsPremium(false);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [refreshPremium, supabase.auth]);
  
  // Load premium status on initialization
  useEffect(() => {
    refreshUserSettings();
  }, [refreshUserSettings]);
  
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
        
        // Only record focus time if this was a work session
        if (timerType === 'work') {
          // Record the focus time server-side (anti-cheat)
          const totalSeconds = settings.workDuration * 60;
          const response = await recordFocusTime(totalSeconds);
          
          if (response.error) {
            console.error('Failed to record focus time:', response.error);
          }
        }
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    }  
    
    // Play sound if sound is enabled (premium feature)
    if (soundEnabled && currentSound && isPremium) {
      try {
        const audio = new Audio(currentSound);
        await audio.play();
      } catch (error) {
        console.error('Error playing sound:', error);
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
      // Only increment pomodoros and cycle position if this was a work timer
      
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
  
  // Change timer type
  const changeTimerType = (type: TimerType) => {
    // Only allow changing timer type when timer is idle or finished
    if (timerState === 'running' || timerState === 'paused') {
      toast.warning("Please reset or complete the current timer first");
      return;
    }
    
    setTimerType(type);
    
    // Update time remaining based on the selected timer type
    if (type === 'work') {
      setTimeRemaining(settings.workDuration * 60);
    } else if (type === 'short_break') {
      setTimeRemaining(settings.shortBreakDuration * 60);
    } else {
      setTimeRemaining(settings.longBreakDuration * 60);
    }
    
    // Reset state to idle
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

  // Deep focus mode effect
  useEffect(() => {
    if (!isPremium) return;

    if (deepFocusMode) {
      // Apply deep focus class to body
      document.body.classList.add('deep-focus-mode');
      
      // Hide header and footer
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      if (header) header.classList.add('focus-hidden');
      if (footer) footer.classList.add('focus-hidden');
      
      // Apply Do Not Disturb
      document.body.classList.add('do-not-disturb');
      
      // Apply fullscreen
      try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen && !document.fullscreenElement) {
          docEl.requestFullscreen();
          document.body.classList.add('fullscreen');
        } else if ((docEl as any).mozRequestFullScreen && !(document as any).mozFullScreenElement) {
          (docEl as any).mozRequestFullScreen();
          document.body.classList.add('fullscreen');
        } else if ((docEl as any).webkitRequestFullscreen && !(document as any).webkitFullscreenElement) {
          (docEl as any).webkitRequestFullscreen();
          document.body.classList.add('fullscreen');
        } else if ((docEl as any).msRequestFullscreen && !(document as any).msFullscreenElement) {
          (docEl as any).msRequestFullscreen();
          document.body.classList.add('fullscreen');
        }
      } catch (error) {
        console.error('Failed to enter fullscreen mode:', error);
      }

      // Create vignette overlay element
      if (!document.querySelector('.vignette-overlay')) {
        const vignette = document.createElement('div');
        vignette.className = 'vignette-overlay';
        document.body.appendChild(vignette);
        
        setTimeout(() => {
          if (vignette instanceof HTMLElement) {
            vignette.style.opacity = '1';
          }
        }, 10);
      }
    }
    
    return () => {
      // Only clean up if deep focus mode was on
      if (deepFocusMode) {
        document.body.classList.remove('deep-focus-mode');
        document.body.classList.remove('do-not-disturb');
        document.body.classList.remove('fullscreen');
        
        // Restore header and footer
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        if (header) header.classList.remove('focus-hidden');
        if (footer) footer.classList.remove('focus-hidden');
        
        // Exit fullscreen if needed
        if (document.fullscreenElement) {
          try {
            document.exitFullscreen();
          } catch (error) {
            console.error('Failed to exit fullscreen mode:', error);
          }
        } else if ((document as any).webkitFullscreenElement) {
          try {
            (document as any).webkitExitFullscreen();
          } catch (error) {
            console.error('Failed to exit fullscreen mode:', error);
          }
        } else if ((document as any).mozFullScreenElement) {
          try {
            (document as any).mozCancelFullScreen();
          } catch (error) {
            console.error('Failed to exit fullscreen mode:', error);
          }
        } else if ((document as any).msFullscreenElement) {
          try {
            (document as any).msExitFullscreen();
          } catch (error) {
            console.error('Failed to exit fullscreen mode:', error);
          }
        }
        
        // Remove vignette
        const vignette = document.querySelector('.vignette-overlay');
        if (vignette) {
          if (vignette instanceof HTMLElement) {
            vignette.style.opacity = '0';
            setTimeout(() => {
              vignette.remove();
            }, 500);
          } else {
            vignette.remove();
          }
        }
      }
    };
  }, [deepFocusMode, isPremium]);
   
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
    changeTimerType,
    setCurrentTask,
    updateSettings,
    refreshTasks,
    tasksVersion,
    
    // Premium features
    isPremium,
    refreshUserSettings,
    soundEnabled,
    setSoundEnabled,
    currentSound,
    setCurrentSound,
    deepFocusMode,
    setDeepFocusMode,
    animationType,
    setAnimationType,
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