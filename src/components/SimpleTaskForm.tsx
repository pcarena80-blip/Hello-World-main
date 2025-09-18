import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
// Select components removed - using native HTML select
import { 
  Calendar,
  Clock,
  Users,
  Tag,
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIcon,
  UserPlus,
  X,
  Target,
  AlertTriangle,
  Crown,
  Shield,
  UserCheck
} from 'lucide-react';
import { AISpellChecker } from './AISpellChecker';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { canAssignTasksToSelf, getNoSelfAssignmentMessage } from '@/types/organization';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskFormData, Project, TASK_STATUSES, TASK_PRIORITIES } from '@/types/tasks';

interface SimpleTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
  organizationId?: string;
  editingTask?: Task | null;
}

export function SimpleTaskForm({ isOpen, onClose, onTaskCreated, editingTask, organizationId }: SimpleTaskFormProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  
  console.log('SimpleTaskForm - availableUsers:', availableUsers.length, availableUsers);
  console.log('SimpleTaskForm - isOpen:', isOpen);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    status: TASK_STATUSES[0],
    priority: TASK_PRIORITIES[1],
    projectId: '',
    assignedTo: 'unassigned',
    startDate: '',
    dueDate: '',
    createdBy: { id: user?.id || 0, name: user?.name || '', email: user?.email || '' },
    tags: [],
    estimatedHours: 0,
    effortEstimate: 0,
    watchers: []
  });

  const [dateValidation, setDateValidation] = useState<{
    isValid: boolean;
    message: string;
    suggestedDate?: string;
  }>({ isValid: true, message: '' });

  // Safety check to ensure formData has required properties
  const isFormDataValid = formData && typeof formData === 'object';
  
  console.log('SimpleTaskForm validation check:', { 
    formData, 
    isFormDataValid, 
    title: formData?.title, 
    titleType: typeof formData?.title 
  });

  // Load data when dialog opens
  useEffect(() => {
    console.log('useEffect triggered - isOpen:', isOpen);
    if (isOpen) {
      console.log('Dialog is open, loading data...');
      loadProjects();
      loadUsers();
      if (editingTask) {
        console.log('Editing existing task:', editingTask);
        setFormData({
          ...editingTask,
          createdBy: editingTask.createdBy
        });
      } else {
        console.log('Creating new task');
        // Reset form for new task
        setFormData({
          title: '',
          description: '',
          status: TASK_STATUSES[0],
          priority: TASK_PRIORITIES[1],
          projectId: '',
          assignedTo: 'unassigned',
          startDate: '',
          dueDate: '',
          createdBy: { id: user?.id || 0, name: user?.name || '', email: user?.email || '' },
          tags: [],
          estimatedHours: 0,
          effortEstimate: 0,
          watchers: []
        });
      }
    }
  }, [isOpen, editingTask, user]);

  // Validate dates when they change
  useEffect(() => {
    if (formData.projectId && formData.dueDate) {
      validateDates();
    }
  }, [formData.projectId, formData.dueDate, formData.startDate]);

  const loadProjects = async () => {
    try {
      const response = await fetch(`/api/projects?organizationId=${organizationId || 'default-org'}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users for Assign To dropdown...');
      if (!organizationId) {
        setAvailableUsers([]);
        return;
      }
      
      const response = await fetch(`/api/organizations/${organizationId}/users`);
      if (response.ok) {
        const data = await response.json();
        console.log('Organization users loaded successfully:', data.length, 'users');
        setAvailableUsers(data);
      } else {
        console.error('Failed to load organization users, response not ok:', response.status);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setAvailableUsers([]);
    }
  };

  const validateDates = () => {
    const selectedProject = projects.find(p => p.id === formData.projectId);
    if (!selectedProject) return;

    const projectStartDate = selectedProject.startDate ? new Date(selectedProject.startDate) : null;
    const projectDueDate = new Date(selectedProject.dueDate);
    const taskStartDate = formData.startDate ? new Date(formData.startDate) : null;
    const taskDueDate = formData.dueDate ? new Date(formData.dueDate) : null;

    // Check if task due date exceeds project due date
    if (taskDueDate && taskDueDate > projectDueDate) {
      setDateValidation({
        isValid: false,
        message: `Task must finish on or before ${projectDueDate.toLocaleDateString()}`,
        suggestedDate: projectDueDate.toISOString().split('T')[0]
      });
      return;
    }

    // Check if task start date is before project start date
    if (taskStartDate && projectStartDate && taskStartDate < projectStartDate) {
      setDateValidation({
        isValid: false,
        message: `Task cannot start before project start date (${projectStartDate.toLocaleDateString()})`,
        suggestedDate: projectStartDate.toISOString().split('T')[0]
      });
      return;
    }

    // Check if task start date is after due date
    if (taskStartDate && taskDueDate && taskStartDate > taskDueDate) {
      setDateValidation({
        isValid: false,
        message: 'Task start date cannot be after due date',
        suggestedDate: taskDueDate.toISOString().split('T')[0]
      });
      return;
    }

    setDateValidation({ isValid: true, message: '' });
  };

  const handleCreateTask = async () => {
    if (!formData.title?.trim()) {
      toast({
        title: "Error",
        description: "Task title is required.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.projectId) {
      toast({
        title: "Error",
        description: "Please select a project for this task.",
        variant: "destructive"
      });
      return;
    }

    if (!dateValidation.isValid) {
      toast({
        title: "Invalid Dates",
        description: dateValidation.message,
        variant: "destructive"
      });
      return;
    }

    // Check no-self assignment rule
    if (currentOrganization && formData.assignedTo && typeof formData.assignedTo === 'object' && formData.assignedTo.id) {
      const userRole = currentOrganization.userRole;
      if (userRole && !canAssignTasksToSelf(userRole as any)) {
        if (formData.assignedTo.id === user?.id?.toString()) {
          toast({
            title: "Assignment Not Allowed",
            description: getNoSelfAssignmentMessage(userRole as any),
            variant: "destructive"
          });
          return;
        }
      }
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: editingTask ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: editingTask?.id,
          organizationId: organizationId || 'default-org',
          assignedTo: typeof formData.assignedTo === 'string' ? 
            (formData.assignedTo === 'unassigned' ? null : { name: formData.assignedTo }) : 
            formData.assignedTo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save task');
      }

      const savedTask = await response.json();

      // Send notification if task is assigned
      if (formData.assignedTo && typeof formData.assignedTo === 'object' && formData.assignedTo.id) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: formData.assignedTo.id.toString(),
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned a new task: "${formData.title}"`,
            payload: {
              entityType: 'task',
              entityId: savedTask.id,
              projectId: formData.projectId
            },
            deliveryChannels: ['in-app', 'email']
          }),
        });
      }

      toast({
        title: editingTask ? "Task Updated" : "Task Created",
        description: `Task "${formData.title}" ${editingTask ? 'updated' : 'created'} successfully.`,
      });

      onTaskCreated(savedTask);
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Safety check to ensure formData has required properties
  if (!isFormDataValid) {
    console.log('SimpleTaskForm: Form data invalid, returning null');
    return null;
  }

  
  console.log('SimpleTaskForm about to render Dialog:', { isOpen });
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle>TEST DIALOG - {editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            This is a test dialog to see if it opens properly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4">
          <p>Dialog is working! isOpen: {isOpen.toString()}</p>
          <p>OrganizationId: {organizationId}</p>
          <Button onClick={onClose}>Close</Button>
        </div>

        <div className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-4">
            <div>
              <Label>Select Project *</Label>
              <p className="text-sm text-gray-500 mb-4">
                Choose which project this task belongs to. This determines the date boundaries.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No projects found</p>
                    <p className="text-sm">Create a project first before adding tasks</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setFormData({ ...formData, projectId: project.id })}
                      className={`w-full p-4 border rounded-lg text-left transition-colors ${
                        formData.projectId === project.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-gray-500">{project.description}</div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>Due: {new Date(project.dueDate).toLocaleDateString()}</div>
                          {project.startDate && (
                            <div>Start: {new Date(project.startDate).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <AISpellChecker
                text={formData.title}
                onTextChange={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter task title"
                className="min-h-[40px]"
                rows={1}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <AISpellChecker
                text={formData.description}
                onTextChange={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe what needs to be done"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  value={formData.priority.id}
                  onChange={(e) => {
                    const priority = TASK_PRIORITIES.find(p => p.id === e.target.value);
                    if (priority) {
                      setFormData({ ...formData, priority });
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  value={formData.status.id}
                  onChange={(e) => {
                    const status = TASK_STATUSES.find(s => s.id === e.target.value);
                    if (status) {
                      setFormData({ ...formData, status });
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>

          {/* Assignment & Dates */}
          <div className="space-y-4">
            <div>
              <Label>Assign To</Label>
              {currentOrganization && !canAssignTasksToSelf(currentOrganization.userRole as any) && (
                <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center gap-2 text-amber-800 text-sm">
                    <Crown className="h-4 w-4" />
                    <span>{getNoSelfAssignmentMessage(currentOrganization.userRole as any)}</span>
                  </div>
                </div>
              )}
              <select
                value={typeof formData.assignedTo === 'string' ? formData.assignedTo : formData.assignedTo?.id.toString() || 'unassigned'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'unassigned') {
                    setFormData({ ...formData, assignedTo: 'unassigned' });
                  } else {
                    const user = availableUsers.find(u => u.id.toString() === value);
                    if (user) {
                      setFormData({ ...formData, assignedTo: user });
                    }
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="unassigned">Unassigned</option>
                {availableUsers
                  .filter((availableUser) => {
                    // Filter out current user if they can't assign tasks to themselves
                    if (currentOrganization && availableUser.id.toString() === user?.id?.toString()) {
                      const userRole = currentOrganization.userRole;
                      return userRole ? canAssignTasksToSelf(userRole as any) : true;
                    }
                    return true;
                  })
                  .map((availableUser) => (
                    <option key={availableUser.id} value={availableUser.id.toString()}>
                      {availableUser.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            {!dateValidation.isValid && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Date Validation Error</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{dateValidation.message}</p>
                {dateValidation.suggestedDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setFormData({ ...formData, dueDate: dateValidation.suggestedDate })}
                  >
                    Fix Date
                  </Button>
                )}
              </div>
            )}

            {formData.projectId && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">Project Timeline</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  {(() => {
                    const project = projects.find(p => p.id === formData.projectId);
                    if (!project) return '';
                    return project.startDate 
                      ? `${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.dueDate).toLocaleDateString()}`
                      : `Due by ${new Date(project.dueDate).toLocaleDateString()}`;
                  })()}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimatedHours: parseInt(e.target.value) || 0,
                  effortEstimate: parseInt(e.target.value) || 0
                })}
                placeholder="Enter estimated hours"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={loading || !formData.title?.trim() || !formData.projectId || !dateValidation.isValid}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {editingTask ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {editingTask ? 'Update Task' : 'Create Task'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
