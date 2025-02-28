/*

task dialog component
 
- a modal dialog for creating and editing tasks

 */
'use client';

import React, { useState, useEffect } from 'react';
import { createTask, updateTask, getTaskById, getTags } from '@/lib/supabase';
import { Task, Tag } from '@/types/database';
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
import { Badge } from '@/components/ui/badge';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Type guard to check if a tag is a Tag object
  const isTagObject = (tag: any): tag is Tag => {
    return typeof tag === 'object' && tag !== null && 'id' in tag && 'name' in tag && 'color' in tag;
  };

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      if (!taskId) {
        setTitle('');
        setDescription('');
        setEstimatedPomodoros(1);
        setSelectedTags([]);
      }
      
      loadData();
    }
  }, [isOpen, taskId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load available tags
      const tags = await getTags();
      setAvailableTags(tags);

      // If editing existing task, load task data
      if (taskId) {
        const task = await getTaskById(taskId);
        setTitle(task.title);
        setDescription(task.description || '');
        setEstimatedPomodoros(task.estimated_pomodoros);
        
        // Check if task.tags exists and is an array
        if (task.tags && Array.isArray(task.tags)) {
          const tagIds: string[] = task.tags.map(tag => 
            // If tag is an object with id property, use that id
            // If tag is already a string (id), use it directly
            isTagObject(tag) ? tag.id : tag
          );
          setSelectedTags(tagIds);
        }
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
        tags: selectedTags,
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

      // Close dialog and refresh tasks
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(taskId ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
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
              />
            </div>

            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableTags.map(tag => (
                    <Badge
                      key={tag.id}
                      style={{ 
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                        color: selectedTags.includes(tag.id) ? 'white' : 'currentColor',
                        borderColor: tag.color
                      }}
                      className="cursor-pointer border"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
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
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}