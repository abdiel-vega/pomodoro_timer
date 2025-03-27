/*

task dialog component
 
- a modal dialog for creating and editing tasks

 */
'use client';

import React, { useState, useEffect } from 'react';
import { createTask, updateTask, getTaskById } from '@/lib/supabase';
import { usePomodoroTimer } from '@/contexts/pomodoro_context';
import { Task } from '@/types/database';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskId?: string; // If provided, we're editing an existing task
}

export default function TaskDialog({ isOpen, onClose, onSuccess, taskId }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get refreshTasks from context
  const { refreshTasks } = usePomodoroTimer();

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      if (!taskId) {
        setTitle('');
        setDescription('');
        setEstimatedPomodoros(1);
        setIsImportant(false);
      }
      
      loadData();
    }
  }, [isOpen, taskId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // If editing existing task, load task data
      if (taskId) {
        const task = await getTaskById(taskId);
        setTitle(task.title);
        setDescription(task.description || '');
        setEstimatedPomodoros(task.estimated_pomodoros);
        setIsImportant(task.is_important || false);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const taskData = {
        title,
        description: description || null,
        estimated_pomodoros: estimatedPomodoros,
        is_important: isImportant,
        is_completed: false,
        completed_pomodoros: 0
      };

      if (taskId) {
        // Update existing task
        await updateTask(taskId, taskData);
        toast.success('Task updated successfully');
      } else {
        // Create new task
        await createTask(taskData);
        toast.success('Task created successfully');
      }

      // Use refreshTasks to update all UI components
      await refreshTasks();

      // Call onSuccess callback
      onSuccess();

      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(taskId ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg text-foreground">
        <DialogHeader>
          <DialogTitle>{taskId ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="What do you need to do?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add details about your task..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedPomodoros">
                Estimated Pomodoros: {estimatedPomodoros}
              </Label>
              <Slider
                id="estimatedPomodoros"
                min={1}
                max={10}
                step={1}
                value={[estimatedPomodoros]}
                onValueChange={values => setEstimatedPomodoros(values[0])}
                className="mt-2"
                style={{ 
                  "--slider-bg": "#CDCDCD",
                  "--slider-fg": "#000000"
                } as React.CSSProperties}
              />
            </div>

            {/* Added margin-top (mt-6) to increase spacing */}
            <div className="flex items-center space-x-2 mt-6">
              <Switch
                id="isImportant"
                checked={isImportant}
                onCheckedChange={setIsImportant}
              />
              <Label htmlFor="isImportant">Mark as important</Label>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                onClick={onClose}
                variant={'outline'}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant={'outline'} disabled={isSubmitting || !title}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-background"></div>
                    {taskId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  taskId ? 'Update Task' : 'Create Task'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}