import React, { useState } from 'react';
import { X, Calendar, User, AlertCircle, Settings, Bot, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { TASK_STATUSES, TASK_PRIORITIES, TaskFormData, Task, TaskStatus, TaskPriority } from '../types/tasks';
import { cn } from '../lib/utils';
import CustomStatusManager from './CustomStatusManager';
import { AIJobRequest, AIJobResponse } from '../services/aiJobManager';

interface AdminTaskFormProps {
  onClose: () => void;
  isAdmin?: boolean;
  editTask?: Task;
}

export function TaskForm({ onClose, isAdmin = false, editTask }: AdminTaskFormProps) {
  const { addTask, updateTask, getAllUsers, customStatuses } = useTask();
  const { user } = useAuth();
  const users = getAllUsers();
  const [showStatusManager, setShowStatusManager] = useState(false);
  
  const [formData, setFormData] = useState<Partial<TaskFormData>>({
    title: editTask?.title || '',
    description: editTask?.description || '',
    status: editTask?.status || customStatuses[0] || TASK_STATUSES[0],
    priority: editTask?.priority || TASK_PRIORITIES[1],
    assignedTo: editTask?.assignedTo || null,
    startDate: editTask?.startDate || '',
    dueDate: editTask?.dueDate || '',
    estimatedHours: editTask?.estimatedHours || undefined,
    tags: editTask?.tags || [],
    progress: editTask?.progress || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // AI-powered task creation states
  const [aiInput, setAiInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showAiInput, setShowAiInput] = useState(true);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Task description is required';
    }

    if (isAdmin && !formData.assignedTo) {
      newErrors.assignedTo = 'Please assign this task to a user';
    }

    if (formData.startDate && formData.dueDate) {
      const startDate = new Date(formData.startDate);
      const dueDate = new Date(formData.dueDate);
      
      if (startDate > dueDate) {
        newErrors.startDate = 'Start date cannot be after due date';
      }
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData: TaskFormData = {
        title: formData.title!,
        description: formData.description || '',
        status: formData.status!,
        priority: formData.priority!,
        assignedTo: formData.assignedTo || null,
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours,
        tags: formData.tags || [],
        progress: formData.progress || 0,
      };

      if (editTask) {
        await updateTask(editTask.id, taskData);
      } else {
        await addTask(taskData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setErrors({ submit: 'Failed to save task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: string | TaskStatus | TaskPriority | { id: number; name: string; email: string; } | null | number | string[] | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags?.includes(tag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), tag.trim()]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  // AI-powered task creation function
  const processAiInput = async () => {
    if (!aiInput.trim()) return;
    
    setIsAiProcessing(true);
    setErrors({}); // Clear previous errors
    
    try {
      console.log('🤖 Starting AI task creation with input:', aiInput);
      
      const aiJobRequest: AIJobRequest = {
        jobType: 'create_task',
        query: aiInput,
        context: {
          availableUsers: availableUsers.map(u => ({ id: u.id, name: u.name, email: u.email })),
          availableStatuses: customStatuses.length > 0 ? customStatuses : TASK_STATUSES,
          availablePriorities: TASK_PRIORITIES,
          currentDate: new Date().toISOString().split('T')[0]
        },
        userId: user?.id?.toString()
      };

      console.log('🤖 AI Job Request:', aiJobRequest);

      const response = await fetch('/api/ai-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiJobRequest)
      });

      console.log('🤖 AI Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 AI request failed:', errorText);
        throw new Error(`AI request failed: ${response.statusText} - ${errorText}`);
      }

      const result: AIJobResponse = await response.json();
      console.log('🤖 AI Response:', result);
      
      // Parse AI response and populate form fields
      try {
        // Extract JSON from markdown code blocks if present
        let jsonString = result.response.trim();
        
        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Clean up any extra whitespace
        jsonString = jsonString.trim();
        
        console.log('🤖 Extracted JSON string:', jsonString);
        
        const taskData = JSON.parse(jsonString);
        
        // Populate form fields with AI-generated data
        if (taskData.title) {
          handleInputChange('title', taskData.title);
        }
        if (taskData.description) {
          handleInputChange('description', taskData.description);
        }
        if (taskData.priority) {
          const priority = TASK_PRIORITIES.find(p => 
            p.name.toLowerCase() === taskData.priority.toLowerCase() ||
            p.id === taskData.priority
          );
          if (priority) handleInputChange('priority', priority);
        }
        if (taskData.status) {
          const status = (customStatuses.length > 0 ? customStatuses : TASK_STATUSES).find(s => 
            s.id === taskData.status || s.name.toLowerCase() === taskData.status.toLowerCase()
          );
          if (status) handleInputChange('status', status);
        }
        if (taskData.assignedTo && taskData.assignedTo !== 'unassigned') {
          const assignedUser = availableUsers.find(u => 
            u.name.toLowerCase().includes(taskData.assignedTo.toLowerCase()) ||
            u.email.toLowerCase().includes(taskData.assignedTo.toLowerCase())
          );
          if (assignedUser) handleInputChange('assignedTo', assignedUser);
        }
        if (taskData.dueDate) {
          handleInputChange('dueDate', taskData.dueDate);
        }
        if (taskData.startDate) {
          handleInputChange('startDate', taskData.startDate);
        }
        if (taskData.estimatedHours) {
          handleInputChange('estimatedHours', parseFloat(taskData.estimatedHours));
        }
        if (taskData.tags && Array.isArray(taskData.tags)) {
          handleInputChange('tags', taskData.tags);
        }
        
        // Hide AI input after successful processing
        setShowAiInput(false);
        setAiInput('');
        console.log('✅ AI task creation successful!');
        
      } catch (parseError) {
        // If JSON parsing fails, try to extract information from plain text
        console.warn('Failed to parse AI response as JSON, using fallback extraction:', parseError);
        
        const responseText = result.response.toLowerCase();
        
        // Extract title (first line or sentence)
        const titleMatch = result.response.split('\n')[0] || result.response.split('.')[0];
        if (titleMatch && titleMatch.length < 100) {
          handleInputChange('title', titleMatch.trim());
        }
        
        // Extract priority
        if (responseText.includes('high') || responseText.includes('urgent')) {
          handleInputChange('priority', TASK_PRIORITIES.find(p => p.id === 'high') || TASK_PRIORITIES[2]);
        } else if (responseText.includes('low')) {
          handleInputChange('priority', TASK_PRIORITIES.find(p => p.id === 'low') || TASK_PRIORITIES[0]);
        } else {
          handleInputChange('priority', TASK_PRIORITIES.find(p => p.id === 'medium') || TASK_PRIORITIES[1]);
        }
        
        // Use the full AI response as description if no title was extracted
        if (!titleMatch || titleMatch.length >= 100) {
          handleInputChange('description', result.response);
        }
        
        setShowAiInput(false);
        setAiInput('');
        console.log('✅ AI task creation successful (fallback mode)!');
      }
      
    } catch (error) {
      console.error('❌ AI task creation failed:', error);
      setErrors({ ai: `Failed to process AI request: ${error.message}. Please try again.` });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const availableUsers = users.filter(u => u.role === 'user');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editTask ? 'Edit Task' : 'Create New Task'}
            {isAdmin && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Admin
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI-Powered Task Creation */}
          {showAiInput && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-900">AI Task Assistant</h3>
                  <p className="text-sm text-purple-700">Describe your task in natural language and I'll help structure it</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="e.g., 'Remind John to send the quarterly report to the client by Friday' or 'Create a high priority task for Sarah to review the marketing proposal due next week'"
                  rows={3}
                  className="resize-none border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  disabled={isAiProcessing}
                />
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={processAiInput}
                    disabled={!aiInput.trim() || isAiProcessing}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    size="sm"
                  >
                    {isAiProcessing ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-2" />
                        Create Task with AI
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAiInput(false)}
                    disabled={isAiProcessing}
                  >
                    Fill Manually
                  </Button>
                </div>
                
                {errors.ai && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.ai}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Show manual toggle button when AI input is hidden */}
          {!showAiInput && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAiInput(true)}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <Bot className="h-3 w-3 mr-2" />
                Use AI Assistant
              </Button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title..."
              className={cn(errors.title && "border-red-500")}
            />
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the task in detail..."
              rows={3}
              className={cn(errors.description && "border-red-500")}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Status</Label>
                {user?.role === 'admin' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStatusManager(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Settings className="" />
                    
                  </Button>
                )}
              </div>

              <Select
                value={formData.status?.id}
                onValueChange={(value) => {
                  const status = customStatuses.find(s => s.id === value) || TASK_STATUSES.find(s => s.id === value);
                  if (status) handleInputChange('status', status);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {customStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority?.id}
                onValueChange={(value) => {
                  const priority = TASK_PRIORITIES.find(p => p.id === value);
                  if (priority) handleInputChange('priority', priority);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: priority.color }}
                        />
                        {priority.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Admin-only fields */}
          {isAdmin && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Admin Controls
              </h3>
              
              {/* Assign to User */}
              <div className="space-y-2">
                <Label>Assign to User *</Label>
                <Select
                  value={formData.assignedTo?.id.toString()}
                  onValueChange={(value) => {
                    const selectedUser = availableUsers.find(u => u.id.toString() === value);
                    handleInputChange('assignedTo', selectedUser || null);
                  }}
                >
                  <SelectTrigger className={cn(errors.assignedTo && "border-red-500")}>
                    <SelectValue placeholder="Select a user to assign this task" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assignedTo && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.assignedTo}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={cn(errors.startDate && "border-red-500")}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.startDate}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className={cn(errors.dueDate && "border-red-500")}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.dueDate}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {/* Estimated Hours */}
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours || ''}
              onChange={(e) => handleInputChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Enter Estimated Hours"
            />
          </div>

          {/* Tags */}
         

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Custom Status Manager Modal */}
      <CustomStatusManager
        isOpen={showStatusManager}
        onClose={() => setShowStatusManager(false)}
      />
    </Dialog>
  );
}
