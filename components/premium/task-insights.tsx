'use client';

import { useState, useEffect } from 'react';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTasks } from '@/lib/supabase';
import { Task } from '@/types/database';
import { format, subDays } from 'date-fns';
import { 
  Check, 
  CheckCircle2, 
  Clock, 
  Award, 
  PieChart, 
  BarChart4, 
  AlertCircle, 
  LineChart 
} from 'lucide-react';

export default function TaskInsights() {
  const { isPremium } = usePomodoroTimer();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    if (isPremium) {
      loadTasks();
    }
  }, [isPremium]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const taskData = await getTasks();
      setTasks(taskData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasksByPeriod = () => {
    const cutoffDate = subDays(new Date(), periodDays);
    return tasks.filter(task => new Date(task.created_at) >= cutoffDate);
  };

  // Calculate task completion rate
  const getCompletionRate = () => {
    const filteredTasks = filterTasksByPeriod();
    if (filteredTasks.length === 0) return 0;
    
    const completedTasks = filteredTasks.filter(task => task.is_completed);
    return Math.round((completedTasks.length / filteredTasks.length) * 100);
  };

  // Get average estimated vs actual pomodoros
  const getPomodoroAccuracy = () => {
    const filteredTasks = filterTasksByPeriod().filter(task => task.is_completed);
    if (filteredTasks.length === 0) return { average: 0, percentage: 0 };
    
    const totalEstimated = filteredTasks.reduce((sum, task) => sum + task.estimated_pomodoros, 0);
    const totalActual = filteredTasks.reduce((sum, task) => sum + task.completed_pomodoros, 0);
    
    const accuracy = totalEstimated > 0 
      ? Math.round((totalActual / totalEstimated) * 100) 
      : 0;
    
    return {
      average: totalActual > 0 
        ? Math.round((totalActual / filteredTasks.length) * 10) / 10 
        : 0,
      percentage: accuracy
    };
  };

  // Get most productive day of the week
  const getMostProductiveDay = () => {
    const completedTasks = tasks.filter(task => task.is_completed);
    if (completedTasks.length === 0) return { day: 'N/A', count: 0 };
    
    const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat
    
    completedTasks.forEach(task => {
      const completionDate = task.completed_at ? new Date(task.completed_at) : null;
      if (completionDate) {
        const dayOfWeek = completionDate.getDay();
        dayCount[dayOfWeek]++;
      }
    });
    
    const maxCount = Math.max(...dayCount);
    const maxDayIndex = dayCount.indexOf(maxCount);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      day: days[maxDayIndex],
      count: maxCount
    };
  };

  // Get important task insights
  const getImportantTaskInsights = () => {
    const filteredTasks = filterTasksByPeriod();
    const importantTasks = filteredTasks.filter(task => task.is_important);
    const completedImportant = importantTasks.filter(task => task.is_completed);
    
    const completionRate = importantTasks.length > 0 
      ? Math.round((completedImportant.length / importantTasks.length) * 100) 
      : 0;
    
    return {
      total: importantTasks.length,
      completed: completedImportant.length,
      completionRate
    };
  };

  // Get tasks by completion time
  const getTasksByCompletionTime = () => {
    const completedTasks = tasks.filter(task => task.is_completed && task.completed_at);
    if (completedTasks.length === 0) return [];
    
    // Group by estimated vs actual pomodoros
    const taskGroups = completedTasks.reduce((groups, task) => {
      const estimatedVsActual = task.estimated_pomodoros >= task.completed_pomodoros ? 'under' : 'over';
      if (!groups[estimatedVsActual]) groups[estimatedVsActual] = 0;
      groups[estimatedVsActual]++;
      return groups;
    }, {} as Record<string, number>);
    
    return [
      { name: 'Under/On Estimate', value: taskGroups['under'] || 0 },
      { name: 'Over Estimate', value: taskGroups['over'] || 0 }
    ];
  };

  if (!isPremium) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Task Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Upgrade to Premium to access task insights</p>
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

  const completionRate = getCompletionRate();
  const pomodoroAccuracy = getPomodoroAccuracy();
  const mostProductiveDay = getMostProductiveDay();
  const importantTaskInsights = getImportantTaskInsights();
  const tasksByCompletionTime = getTasksByCompletionTime();
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart size={18} />
            Task Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={periodDays === 7 ? "outline" : "default"}
              size="sm"
              onClick={() => setPeriodDays(7)}
            >
              Week
            </Button>
            <Button
              variant={periodDays === 30 ? "outline" : "default"}
              size="sm"
              onClick={() => setPeriodDays(30)}
            >
              Month
            </Button>
            <Button
              variant={periodDays === 90 ? "outline" : "default"}
              size="sm"
              onClick={() => setPeriodDays(90)}
            >
              3 Months
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
          <div className="space-y-6">
            {/* Task Summary */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={16} className="text-foreground" />
                  <h3 className="text-sm font-medium">Task Completion</h3>
                </div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-bold">{completionRate}%</span>
                  <span className="text-sm text-muted-foreground mb-1">completion rate</span>
                </div>
                <div className="mt-3 bg-accent h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-accent-foreground h-full rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              
              <div className="flex-1 bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={16} className="text-foreground" />
                  <h3 className="text-sm font-medium">Important Tasks</h3>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{importantTaskInsights.completionRate}%</span>
                  <span className="text-sm text-muted-foreground ml-2">completed</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {importantTaskInsights.completed} of {importantTaskInsights.total} important tasks completed
                </p>
              </div>
            </div>
            
            {/* Pomodoro Accuracy */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-foreground" />
                <h3 className="text-sm font-medium">Pomodoro Estimation Accuracy</h3>
              </div>
              <div className="flex items-center justify-between gap-4 mt-2">
                <div>
                  <span className="text-3xl font-bold">{pomodoroAccuracy.percentage}%</span>
                  <span className="text-sm text-muted-foreground ml-2">accuracy</span>
                </div>
                <div className="text-sm">
                  You typically use <span className="font-medium">{pomodoroAccuracy.average}</span> pomodoros per task
                </div>
              </div>
              
              {/* Estimation chart */}
              <div className="mt-3">
                <h4 className="text-xs font-medium mb-2">Tasks vs. Estimates</h4>
                <div className="flex gap-2 items-center">
                  <div 
                    className="bg-blue-500 rounded-sm h-4"
                    style={{ width: `${(tasksByCompletionTime[0]?.value || 0) / (tasks.filter(t => t.is_completed).length || 1) * 100}%` }}
                  />
                  <span className="text-xs">{tasksByCompletionTime[0]?.value || 0} under/on estimate</span>
                </div>
                <div className="flex gap-2 items-center mt-1">
                  <div 
                    className="bg-orange-400 rounded-sm h-4"
                    style={{ width: `${(tasksByCompletionTime[1]?.value || 0) / (tasks.filter(t => t.is_completed).length || 1) * 100}%` }}
                  />
                  <span className="text-xs">{tasksByCompletionTime[1]?.value || 0} over estimate</span>
                </div>
              </div>
            </div>
            
            {/* Productivity Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart4 size={16} className="text-foreground" />
                  <h3 className="text-sm font-medium">Most Productive Day</h3>
                </div>
                <p className="text-2xl font-bold">{mostProductiveDay.day}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mostProductiveDay.count} tasks completed on this day
                </p>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={16} className="text-foreground" />
                  <h3 className="text-sm font-medium">Task Efficiency</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {pomodoroAccuracy.percentage > 90 
                        ? 'Excellent estimator!' 
                        : pomodoroAccuracy.percentage > 70 
                          ? 'Good at estimating' 
                          : 'Need to improve estimates'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pomodoroAccuracy.percentage > 90 
                        ? 'Your time estimates are very accurate' 
                        : pomodoroAccuracy.percentage > 70 
                          ? 'Your task planning is good, but could be more precise' 
                          : 'Try breaking tasks into smaller chunks for better estimates'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-medium mb-3">Recent Task Activity</h3>
              <div className="space-y-2">
                {filterTasksByPeriod()
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="flex items-center gap-2 p-2 border border-accent-foreground rounded-md">
                      {task.is_completed ? (
                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock size={16} className="text-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.is_completed 
                            ? `Completed ${task.completed_at ? format(new Date(task.completed_at), 'MMM d') : ''}` 
                            : `Updated ${format(new Date(task.updated_at), 'MMM d')}`}
                        </p>
                      </div>
                      <div className="text-xs">
                        {task.completed_pomodoros}/{task.estimated_pomodoros}
                      </div>
                    </div>
                  ))}
                
                {filterTasksByPeriod().length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No tasks found in this time period
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center text-xs text-muted-foreground mt-4">
              Based on {filterTasksByPeriod().length} tasks over the past {periodDays} days
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}