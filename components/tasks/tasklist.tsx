/*

taskList component

- uses dialog instead of page navigation for creating/editing tasks

 */
'use client';

import React, { useState, useEffect } from 'react';
import { getTasks, deleteTask, toggleTaskCompletion } from '@/lib/supabase';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Task } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, ClockIcon, TrashIcon, EditIcon, PlayIcon, AlertCircleIcon, XCircleIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import TaskDialog from '@/components/tasks/taskdialog';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>(undefined);
  
  // Get context including the currentTask, refreshTasks function and tasksVersion
  const { currentTask, setCurrentTask, refreshTasks, tasksVersion } = usePomodoroTimer();

  // Load tasks from database or local storage
  const loadTasks = async () => {
    try {
      setLoading(true);
      const taskData = await getTasks();
      console.log('Loaded tasks:', taskData);
      setTasks(taskData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh when tasksVersion changes
  useEffect(() => {
    loadTasks();
  }, [tasksVersion]); // This will reload tasks whenever tasksVersion changes

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'pending') {
      return !task.is_completed;
    } else if (activeTab === 'completed') {
      return task.is_completed;
    }
    return true; // 'all' tab
  });

  // Handle task completion toggle
  const handleTaskCompletionToggle = async (taskId: string) => {
    try {
      const updatedTask = await toggleTaskCompletion(taskId);
      
      // Update the tasks state with the new task
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );
      
      // Show appropriate toast message
      if (updatedTask.is_completed) {
        toast.success('Task completed');
        
        // If this was the current task, unset it
        if (currentTask && currentTask.id === taskId) {
          setCurrentTask(null);
        }
      } else {
        toast.success('Task marked as incomplete');
      }
      
      // Refresh tasks in the context to ensure all components are in sync
      await refreshTasks();
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      toast.error('Failed to update task');
    }
  };

  // Handle task deletion
  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(prevTasks => 
        prevTasks.filter(task => task.id !== taskId)
      );
      toast.success('Task deleted');
      
      // If this was the current task, unset it
      if (currentTask && currentTask.id === taskId) {
        setCurrentTask(null);
      }
      
      // Refresh tasks in the context to ensure all components are in sync
      await refreshTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Handle selecting a task for the timer
  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
    toast.success(`Now focusing on: ${task.title}`);
  };

  // Handle unselecting the current task (unfocus)
const handleUnselectTask = () => {
  setCurrentTask(null);
  toast.success("Task unfocused");
};

  // Open dialog for creating a new task
  const handleNewTask = () => {
    setEditingTaskId(undefined);
    setDialogOpen(true);
  };

  // Open dialog for editing an existing task
  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTaskId(undefined);
  };

  // Handle successful task creation or update
  const handleTaskSuccess = async () => {
    // Use the refreshTasks function instead of calling loadTasks directly
    await refreshTasks();
  };

  // Check if a task is the currently focused task
  const isCurrentTask = (taskId: string): boolean => {
    return !!(currentTask && currentTask.id === taskId);
  };

  return (
    <>
      <Card className="w-full task-list-container border-zinc-400 dark:border-zinc-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>
        <Button onClick={handleNewTask} size="sm">
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
                      className={`border rounded-lg p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors ${
                        isCurrentTask(task.id) ? 'border-primary bg-primary/5' : 
                        task.is_important ? 'border-orange-500' : ''
                      }`}
                    >
                      <Checkbox 
                        checked={task.is_completed}
                        onCheckedChange={() => handleTaskCompletionToggle(task.id)}
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* Important indicator */}
                          {task.is_important && (
                            <span title="Important task">
                              <AlertCircleIcon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            </span>
                          )}

                          <h3 className={`font-medium truncate ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                            {isCurrentTask(task.id) && (
                              <Badge variant="outline" className="ml-2 border-primary text-primary text-xs">
                                Focused
                              </Badge>
                            )}
                          </h3>
                        </div>
                        
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
                          
                          {/* Show important badge */}
                          {task.is_important && (
                            <Badge 
                              className="bg-orange-500 text-white"
                            >
                              Important
                            </Badge>
                          )}
                        </div>
                      </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {!task.is_completed && (
                          isCurrentTask(task.id) ? (
                          // Show unfocus button for currently focused task
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUnselectTask()}
                              aria-label="Unfocus this task"
                            >
                              <XCircleIcon className="h-4 w-4 text-primary" />
                            </Button>
                          ) : (
                            // Show focus button for non-focused tasks
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSelectTask(task)}
                              aria-label="Focus on this task"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </Button>
                          )
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditTask(task.id)}
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

      {/* Task Dialog */}
      <TaskDialog 
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleTaskSuccess}
        taskId={editingTaskId}
      />
    </>
  );
}