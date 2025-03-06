/*

task form component

*/
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTask, updateTask, getTaskById } from '@/lib/supabase';
import { Task } from '@/types/database';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface TaskFormProps {
  taskId?: string; // If provided, we're editing an existing task
}

export default function TaskForm({ taskId }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
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

    loadData();
  }, [taskId]);

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

      // Navigate back to tasks
      router.push('/');
      router.refresh(); // Refresh page to reflect changes
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(taskId ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{taskId ? 'Edit Task' : 'Create New Task'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="What do you need to do?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
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
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isImportant"
              checked={isImportant}
              onCheckedChange={setIsImportant}
            />
            <Label htmlFor="isImportant">Mark as important</Label>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !title}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-background"></div>
                {taskId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              taskId ? 'Update Task' : 'Create Task'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}