// components/tasks/TaskList.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTasks, completeTask, deleteTask } from '@/lib/supabase';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Task } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, ClockIcon, TrashIcon, EditIcon, PlayIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const router = useRouter();
  const { setCurrentTask } = usePomodoroTimer();

  // Load tasks from database
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const taskData = await getTasks();
        setTasks(taskData);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'pending') {
      return !task.is_completed;
    } else if (activeTab === 'completed') {
      return task.is_completed;
    }
    return true; // 'all' tab
  });

  // Handle task completion
  const handleTaskComplete = async (taskId: string) => {
    try {
      const updatedTask = await completeTask(taskId);
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  // Handle task deletion
  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(prevTasks => 
        prevTasks.filter(task => task.id !== taskId)
      );
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Handle selecting a task for the timer
  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>
        <Button onClick={() => router.push('/tasks/new')} size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {activeTab === 'pending' 
                  ? "No pending tasks. Create a new one to get started!"
                  : activeTab === 'completed'
                    ? "No completed tasks yet."
                    : "No tasks found."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <div 
                    key={task.id}
                    className="border rounded-lg p-4 flex items-start justify-between gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox 
                        checked={task.is_completed}
                        onCheckedChange={() => handleTaskComplete(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            <span>
                              {task.completed_pomodoros}/{task.estimated_pomodoros} pomodoros
                            </span>
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.map(tag => (
                                <Badge key={tag.id} style={{ backgroundColor: tag.color }}>
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!task.is_completed && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSelectTask(task)}
                          title="Focus on this task"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/tasks/edit/${task.id}`)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleTaskDelete(task.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}