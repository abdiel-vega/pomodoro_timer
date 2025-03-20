'use client';

import { useState, useEffect } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getSessions, getTasks } from '@/lib/supabase';
import { Session, Task } from '@/types/database';
import { 
  BarChart3, 
  TrendingUp, 
  BrainCircuit, 
  Clock, 
  CalendarCheck2, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { differenceInDays, format, startOfDay, endOfDay, subDays } from 'date-fns';

export default function FocusAnalytics() {
  const { isPremium } = usePomodoroTimer();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [loading, setLoading] = useState(true);
  const [focusScore, setFocusScore] = useState<number>(0);
  const [focusTrend, setFocusTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [stats, setStats] = useState({
    totalFocusTime: 0,
    completedTasks: 0,
    completionRate: 0,
    averageFocusLength: 0,
    dailyAverage: 0
  });

  useEffect(() => {
    if (isPremium) {
      loadData();
    }
  }, [isPremium]);

  useEffect(() => {
    if (sessions.length > 0 && tasks.length > 0) {
      calculateStats();
    }
  }, [sessions, tasks, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionData, taskData] = await Promise.all([
        getSessions(),
        getTasks()
      ]);
      setSessions(sessionData);
      setTasks(taskData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data by selected period
  const filterByPeriod = (data: (Session | Task)[]) => {
    const now = new Date();
    let cutoffDate: Date;
    
    if (period === 'week') {
      cutoffDate = subDays(now, 7);
    } else if (period === 'month') {
      cutoffDate = subDays(now, 30);
    } else {
      // 'all' period, use a very old date
      cutoffDate = new Date(2000, 0, 1);
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.hasOwnProperty('started_at') 
        ? (item as Session).started_at 
        : (item as Task).created_at);
      return itemDate >= cutoffDate;
    });
  };

  // Calculate statistics based on the filtered data
  const calculateStats = () => {
    // Filter data by period
    const filteredSessions = filterByPeriod(sessions) as Session[];
    const filteredTasks = filterByPeriod(tasks) as Task[];
    
    // Total focus time (in minutes)
    const totalFocusTime = filteredSessions
      .filter(s => s.type === 'work' && s.is_completed)
      .reduce((total, session) => total + (session.duration / 60), 0);
    
    // Completed tasks count
    const completedTasks = filteredTasks.filter(t => t.is_completed).length;
    
    // Task completion rate
    const completionRate = filteredTasks.length > 0 
      ? (completedTasks / filteredTasks.length * 100) 
      : 0;
    
    // Average focus session length (in minutes)
    const focusSessions = filteredSessions.filter(s => s.type === 'work' && s.is_completed);
    const averageFocusLength = focusSessions.length > 0 
      ? (focusSessions.reduce((total, session) => total + (session.duration / 60), 0) / focusSessions.length) 
      : 0;
    
    // Calculate daily average pomodoros
    const now = new Date();
    const earliestDate = filteredSessions.length > 0 
      ? new Date(Math.min(...filteredSessions.map(s => new Date(s.started_at).getTime())))
      : now;
    
    const daysDiff = Math.max(1, differenceInDays(now, earliestDate));
    const totalPomodoros = focusSessions.length;
    const dailyAverage = totalPomodoros / daysDiff;
    
    // Calculate focus score (0-100)
    // This is a weighted score based on multiple factors
    const scoreFactors = {
      totalPomodoros: Math.min(1, totalPomodoros / 20) * 30, // 30% weight
      completionRate: (completionRate / 100) * 40, // 40% weight
      consistency: Math.min(1, dailyAverage / 4) * 30 // 30% weight
    };
    
    const calculatedScore = Object.values(scoreFactors).reduce((sum, factor) => sum + factor, 0);
    
    // Calculate trend by comparing with previous period
    const prevPeriodEnd = subDays(now, period === 'week' ? 7 : period === 'month' ? 30 : 90);
    const prevPeriodStart = subDays(prevPeriodEnd, period === 'week' ? 7 : period === 'month' ? 30 : 90);
    
    const prevPeriodSessions = sessions.filter(s => {
      const date = new Date(s.started_at);
      return date >= prevPeriodStart && date <= prevPeriodEnd && s.type === 'work' && s.is_completed;
    });
    
    const prevPeriodPomodoros = prevPeriodSessions.length;
    const periodDiff = totalPomodoros - prevPeriodPomodoros;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (periodDiff > 2) trend = 'up';
    else if (periodDiff < -2) trend = 'down';
    
    // Update state
    setStats({
      totalFocusTime: Math.round(totalFocusTime),
      completedTasks,
      completionRate: Math.round(completionRate),
      averageFocusLength: Math.round(averageFocusLength),
      dailyAverage: Math.round(dailyAverage * 10) / 10
    });
    
    setFocusScore(Math.round(calculatedScore));
    setFocusTrend(trend);
  };

  // Chart data for daily focus time
  const getDailyFocusData = () => {
    const today = new Date();
    const labels = [];
    const data = [];
    
    // Create days array based on period
    const daysToShow = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const day = subDays(today, i);
      labels.push(format(day, 'MMM d'));
      
      // Calculate total focus time for this day
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayFocusTime = sessions
        .filter(s => {
          const sessionDate = new Date(s.started_at);
          return sessionDate >= dayStart && 
                 sessionDate <= dayEnd && 
                 s.type === 'work' && 
                 s.is_completed;
        })
        .reduce((total, session) => total + (session.duration / 60), 0);
      
      data.push(Math.round(dayFocusTime));
    }
    
    return { labels, data };
  };

  if (!isPremium) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Focus Score & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Upgrade to Premium to access focus analytics</p>
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

  const { labels, data } = getDailyFocusData();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 size={18} />
            Focus Analytics
          </CardTitle>
          <Tabs defaultValue="week" value={period} onValueChange={(value) => setPeriod(value as 'week' | 'month' | 'all')}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Focus Score */}
            <div className="bg-gradient-to-br from-indigo-50 to-teal-50 dark:from-indigo-950/40 dark:to-teal-950/40 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Focus Score</h3>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold">{focusScore}</p>
                    <div className={`flex items-center text-xs ${focusTrend === 'up' ? 'text-green-500' : focusTrend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                      {focusTrend === 'up' ? (
                        <ArrowUpRight size={14} className="mr-1" />
                      ) : focusTrend === 'down' ? (
                        <ArrowDownRight size={14} className="mr-1" />
                      ) : null}
                      {focusTrend === 'up' ? 'Improving' : focusTrend === 'down' ? 'Declining' : 'Stable'}
                    </div>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white">
                  <BrainCircuit size={28} className="text-primary" />
                </div>
              </div>
            </div>
            
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-primary" />
                  <h3 className="text-sm font-medium">Focus Time</h3>
                </div>
                <p className="text-2xl font-bold">{stats.totalFocusTime}m</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {stats.averageFocusLength}m per session
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarCheck2 size={16} className="text-primary" />
                  <h3 className="text-sm font-medium">Tasks</h3>
                </div>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completionRate}% completion rate
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-primary" />
                  <h3 className="text-sm font-medium">Daily Average</h3>
                </div>
                <p className="text-2xl font-bold">{stats.dailyAverage}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  pomodoros per day
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BrainCircuit size={16} className="text-primary" />
                  <h3 className="text-sm font-medium">Best Day</h3>
                </div>
                <p className="text-2xl font-bold">
                  {Math.max(...data) || 0}m
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  most focus time in a day
                </p>
              </div>
            </div>
            
            {/* Chart */}
            <div className="mt-4 rounded border p-4">
              <h3 className="text-sm font-medium mb-4">Daily Focus Time (minutes)</h3>
              <div className="h-40 relative">
                {data.map((value, index) => {
                  const barHeight = Math.min(100, value / (Math.max(...data) || 1) * 100);
                  return (
                    <div key={index} className="absolute bottom-0" style={{
                      left: `${(index / Math.max(data.length - 1, 1)) * 100}%`,
                      transform: 'translateX(-50%)',
                      width: '20px'
                    }}>
                      <div 
                        className="bg-primary rounded-t-sm w-6"
                        style={{ height: `${barHeight}%` }}
                      />
                      <div className="text-xs text-center mt-1">{labels[index % labels.length]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="text-center text-xs text-muted-foreground mt-4">
              Based on {sessions.filter(s => s.type === 'work' && s.is_completed).length} completed focus sessions
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}