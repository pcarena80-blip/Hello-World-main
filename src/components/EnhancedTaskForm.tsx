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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
  ArrowRight,
  ArrowLeft,
  Target,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskFormData, Project, Milestone, TASK_STATUSES, TASK_PRIORITIES } from '@/types/tasks';

interface EnhancedTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
  editingTask?: Task | null;
  organizationId?: string;
}

interface TaskFormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TASK_FORM_STEPS: TaskFormStep[] = [
  {
    id: 'project',
    title: 'Select Project',
    description: 'Choose which project this task belongs to',
    icon: Target
  },
  {
    id: 'details',
    title: 'Task Details',
    description: 'Set title, description, and basic info',
    icon: Tag
  },
  {
    id: 'assignment',
    title: 'Assignment & Dates',
    description: 'Assign to team members and set timeline',
    icon: Users
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Review task details and create',
    icon: CheckCircle
  }
];

export function EnhancedTaskForm({ isOpen, onClose, onTaskCreated, editingTask, organizationId }: EnhancedTaskFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: TASK_STATUSES[0],
    priority: TASK_PRIORITIES[1],
    projectId: '',
    milestoneId: '',
    assignedTo: null,
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

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadProjects();
      loadUsers();
      if (editingTask) {
        setFormData({
          ...editingTask,
          createdBy: editingTask.createdBy
        });
        if (editingTask.projectId) {
          loadMilestones(editingTask.projectId);
        }
      } else {
        // Reset form for new task
        setFormData({
          title: '',
          description: '',
          status: TASK_STATUSES[0],
          priority: TASK_PRIORITIES[1],
          projectId: '',
          milestoneId: '',
          assignedTo: null,
          startDate: '',
          dueDate: '',
          createdBy: { id: user?.id || 0, name: user?.name || '', email: user?.email || '' },
          tags: [],
          estimatedHours: 0,
          effortEstimate: 0,
          watchers: []
        });
        setCurrentStep(0);
      }
    }
  }, [isOpen, editingTask, user]);

  // Load milestones when project changes
  useEffect(() => {
    if (formData.projectId) {
      loadMilestones(formData.projectId);
    } else {
      setMilestones([]);
    }
  }, [formData.projectId]);

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

  const loadMilestones = async (projectId: string) => {
    try {
      const response = await fetch(`/api/milestones?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data);
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
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

  const handleNext = () => {
    if (currentStep < TASK_FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateTask = async () => {
    if (!dateValidation.isValid) {
      toast({
        title: "Invalid Dates",
        description: dateValidation.message,
        variant: "destructive"
      });
      return;
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
          id: editingTask?.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save task');
      }

      const savedTask = await response.json();

      // Send notification if task is assigned
      if (formData.assignedTo) {
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
        description: "Failed to save task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (TASK_FORM_STEPS[currentStep].id) {
      case 'project':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Select Project *</Label>
                <p className="text-sm text-gray-500 mb-4">
                  Choose which project this task belongs to. This determines the date boundaries.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {projects.map((project) => (
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what needs to be done"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority.id}
                    onValueChange={(value) => {
                      const priority = TASK_PRIORITIES.find(p => p.id === value);
                      if (priority) {
                        setFormData({ ...formData, priority });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((priority) => (
                        <SelectItem key={priority.id} value={priority.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: priority.color }}
                            />
                            {priority.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status.id}
                    onValueChange={(value) => {
                      const status = TASK_STATUSES.find(s => s.id === value);
                      if (status) {
                        setFormData({ ...formData, status });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          </div>
        );

      case 'assignment':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Assign To</Label>
                <Select
                  value={formData.assignedTo?.id.toString() || ''}
                  onValueChange={(value) => {
                    const user = availableUsers.find(u => u.id.toString() === value);
                    if (user) {
                      setFormData({ ...formData, assignedTo: user });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {milestones.length > 0 && (
                <div>
                  <Label>Milestone (Optional)</Label>
                  <Select
                    value={formData.milestoneId || ''}
                    onValueChange={(value) => setFormData({ ...formData, milestoneId: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No milestone</SelectItem>
                      {milestones.map((milestone) => (
                        <SelectItem key={milestone.id} value={milestone.id}>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            {milestone.name}
                            <span className="text-sm text-gray-500">
                              ({new Date(milestone.date).toLocaleDateString()})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Task Summary</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {formData.title}</div>
                  <div><strong>Project:</strong> {projects.find(p => p.id === formData.projectId)?.name}</div>
                  <div><strong>Assignee:</strong> {formData.assignedTo?.name || 'Unassigned'}</div>
                  <div><strong>Priority:</strong> {formData.priority.name}</div>
                  <div><strong>Status:</strong> {formData.status.name}</div>
                  <div><strong>Timeline:</strong> {
                    formData.startDate && formData.dueDate
                      ? `${new Date(formData.startDate).toLocaleDateString()} - ${new Date(formData.dueDate).toLocaleDateString()}`
                      : formData.dueDate
                      ? `Due by ${new Date(formData.dueDate).toLocaleDateString()}`
                      : 'No dates set'
                  }</div>
                  <div><strong>Estimated Hours:</strong> {formData.estimatedHours || 0}</div>
                  {formData.milestoneId && (
                    <div><strong>Milestone:</strong> {milestones.find(m => m.id === formData.milestoneId)?.name}</div>
                  )}
                  {formData.tags && formData.tags.length > 0 && (
                    <div><strong>Tags:</strong> {formData.tags.join(', ')}</div>
                  )}
                </div>
              </div>

              {!dateValidation.isValid && (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Cannot Create Task</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{dateValidation.message}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (TASK_FORM_STEPS[currentStep].id) {
      case 'project':
        return formData.projectId !== '';
      case 'details':
        return formData.title.trim() !== '';
      case 'assignment':
        return true;
      case 'review':
        return dateValidation.isValid;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {editingTask ? 'Update task details and assignments' : 'Create a new task and assign it to a project'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Step {currentStep + 1} of {TASK_FORM_STEPS.length}</span>
              <span>{Math.round(((currentStep + 1) / TASK_FORM_STEPS.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / TASK_FORM_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {React.createElement(TASK_FORM_STEPS[currentStep].icon, { className: "h-5 w-5" })}
              <div>
                <h3 className="font-medium">{TASK_FORM_STEPS[currentStep].title}</h3>
                <p className="text-sm text-gray-500">{TASK_FORM_STEPS[currentStep].description}</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === TASK_FORM_STEPS.length - 1 ? (
                <Button
                  onClick={handleCreateTask}
                  disabled={!canProceed() || loading}
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
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
