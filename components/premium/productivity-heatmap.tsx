'use client';

import { useState, useEffect } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSessions } from '@/lib/api';
import { Session } from '@/types/database';
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, addMonths, subMonths } from 'date-fns';
import { Sparkles, ArrowLeft, ArrowRight, CalendarRange } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ProductivityHeatmap() {
  const { isPremium } = usePomodoroTimer();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    if (isPremium) {
      loadSessions();
    }
  }, [isPremium]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const sessionData = await getSessions();
      setSessions(sessionData);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to previous period
  const goToPrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  // Navigate to next period
  const goToNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  // Set current date to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get date range for current view
  const getDateRange = () => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start week on Monday
      return {
        start,
        end: addDays(start, 6),
      };
    } else {
      const start = startOfMonth(currentDate);
      return {
        start,
        end: addMonths(start, 1),
      };
    }
  };

  // Format date range for display
  const formatDateRange = () => {
    const { start, end } = getDateRange();
    if (viewMode === 'week') {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(start, 'MMMM yyyy');
    }
  };

  // Generate days for week view
  const generateWeekDays = () => {
    const days = [];
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start week on Monday
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      days.push(day);
    }
    
    return days;
  };

  // Generate grid for month view
  const generateMonthGrid = () => {
    const result = [];
    const monthStart = startOfMonth(currentDate);
    const firstDayOfMonth = monthStart.getDay() || 7; // getDay() returns 0 for Sunday, we want 7
    const adjustedFirstDay = firstDayOfMonth === 1 ? 1 : firstDayOfMonth - 1; // Adjust to start from Monday
    
    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      result.push(null);
    }
    
    // Add cells for each day of the month
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      result.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    
    return result;
  };

  // Get productivity score for a day (0-4)
  const getProductivityScore = (day: Date) => {
    if (!day) return 0;
    
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Filter work sessions on this day
    const daySessions = sessions.filter(session => {
      const sessionDate = new Date(session.started_at);
      return sessionDate >= dayStart && sessionDate <= dayEnd && session.type === 'work' && session.is_completed;
    });
    
    // Score based on number of completed work sessions
    if (daySessions.length === 0) return 0;
    if (daySessions.length <= 2) return 1;
    if (daySessions.length <= 4) return 2;
    if (daySessions.length <= 6) return 3;
    return 4;
  };

  // Get color for heatmap cell based on productivity score
  const getHeatmapColor = (score: number) => {
    switch (score) {
      case 0: return 'bg-background';
      case 1: return 'bg-green-200';
      case 2: return 'bg-green-300';
      case 3: return 'bg-green-400';
      case 4: return 'bg-green-500';
      default: return 'bg-background';
    }
  };

  // Render heatmap based on view mode
  const renderHeatmap = () => {
    if (viewMode === 'week') {
      const days = generateWeekDays();
      
      return (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-xs text-center font-bold">
                {day}
              </div>
            ))}
            
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="bg-transparent h-10" />;
              }

              const score = getProductivityScore(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`${getHeatmapColor(score)} h-16 rounded-md flex flex-col items-center justify-center p-1 ${isToday ? 'ring-2 ring-secondary-foreground' : ''}`}
                >
                  <span className="text-xs font-medium">
                    {format(day, 'd')}
                  </span>
                  {score > 0 && (
                    <span className="text-xs mt-1 text-foreground">{score * 2} pomodoros</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      const monthDays = generateMonthGrid();
      
      return (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-xs text-center font-medium">
                {day}
              </div>
            ))}
            
            {monthDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="bg-transparent h-10" />;
              }
              
              const score = getProductivityScore(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`${getHeatmapColor(score)} h-10 rounded-md flex items-center justify-center ${isToday ? 'ring-2 ring-secondary-foreground' : ''}`}
                >
                  <span className="text-xs font-medium">
                    {format(day, 'd')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  // Render legend
  const renderLegend = () => {
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-xs">Less</span>
          <>
            <div className="bg-background w-4 h-4 rounded"></div>
            <div className="bg-green-200 w-4 h-4 rounded"></div>
            <div className="bg-green-300 w-4 h-4 rounded"></div>
            <div className="bg-green-400 w-4 h-4 rounded"></div>
            <div className="bg-green-500 w-4 h-4 rounded"></div>
          </>
        <span className="text-xs">More</span>
      </div>
    );
  };  

  if (!isPremium) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Productivity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Upgrade to Premium to access productivity analytics</p>
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
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarRange size={18} />
            Productivity Heatmap
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={viewMode === 'week' ? 'bg-muted' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={viewMode === 'month' ? 'bg-muted' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-secondary-foreground"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ArrowLeft size={16} />
              </Button>
              <div className="text-sm font-medium">
                {formatDateRange()}
              </div>
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ArrowRight size={16} />
              </Button>
            </div>
            
            {renderHeatmap()}
            {renderLegend()}
            
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={goToToday} className='hover:bg-background'>
                Today
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}