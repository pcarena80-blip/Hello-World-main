import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
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
  CheckSquare,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Users,
  Clock,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  Eye,
  Settings,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Paperclip,
  Tag,
  Share,
  Download,
  Upload,
  RefreshCw,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Bell,
  Brain,
  Zap,
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Task, Project, Notification } from '@/types/tasks';
import { TaskPropertiesSidebar } from './PropertiesSidebar';
import { SimpleTaskForm } from './SimpleTaskForm';
import { NotificationSystem } from './NotificationSystem';

interface EnhancedTaskManagementProps {
  organizationId?: string;
  userRole?: string;
}

export function EnhancedTaskManagement({ organizationId, userRole }: EnhancedTaskManagementProps) {
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline' | 'calendar'>('grid');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showPropertiesSidebar, setShowPropertiesSidebar] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    project: 'all',
    assignee: 'all'
  });

  const canEdit = ['super_admin', 'admin', 'manager'].includes(userRole || '');
  const canDelete = ['super_admin', 'admin'].includes(userRole || '');

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTasks(),
        loadProjects(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?organizationId=${organizationId || 'default-org'}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

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

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadNotifications(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [...prev, task]);
    setShowCreateTask(false);
    toast({
      title: "Task Created",
      description: `Task "${task.title}" has been created successfully.`,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        toast({
          title: "Task Deleted",
          description: "Task has been deleted successfully.",
        });
      } else {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowPropertiesSidebar(true);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      // Handle both 'name' and 'projectName' properties
      return project.name || (project as any).projectName || 'Unknown Project';
    }
    return 'Unknown Project';
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.color : '#3B82F6';
  };

  const getTasksByProject = () => {
    const grouped: { [projectId: string]: Task[] } = {};
    tasks.forEach(task => {
      if (!grouped[task.projectId]) {
        grouped[task.projectId] = [];
      }
      grouped[task.projectId].push(task);
    });
    return grouped;
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && task.status.id !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && task.priority.id !== filters.priority) {
      return false;
    }
    if (filters.project !== 'all' && task.projectId !== filters.project) {
      return false;
    }
    if (filters.assignee !== 'all' && task.assignedTo?.id.toString() !== filters.assignee) {
      return false;
    }
    return true;
  });

  const renderTaskCard = (task: Task) => {
    const projectName = getProjectName(task.projectId);
    const projectColor = getProjectColor(task.projectId);
    
    return (
      <Card key={task.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleTaskClick(task)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: projectColor }}
              />
              <div>
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={task.status.id === 'completed' ? 'default' : 'secondary'}>
                {task.status.name}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Project Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="h-4 w-4" />
            <span>{projectName}</span>
          </div>

          {/* Priority and Assignee */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.priority.color }}
              />
              <span>{task.priority.name}</span>
            </div>
            {task.assignedTo && task.assignedTo.name && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{task.assignedTo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{task.assignedTo.name}</span>
              </div>
            )}
          </div>

          {/* Timeline */}
          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span>Due: {(() => {
                try {
                  const date = new Date(task.dueDate);
                  return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                } catch {
                  return 'Invalid Date';
                }
              })()}</span>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTask(task);
                setShowTaskDetails(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <div className="flex items-center gap-1">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(task);
                    setShowCreateTask(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTaskList = (task: Task) => {
    const projectName = getProjectName(task.projectId);
    const projectColor = getProjectColor(task.projectId);
    
    return (
      <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
        <div 
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: projectColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{task.title}</h3>
            <Badge variant={task.status.id === 'completed' ? 'default' : 'secondary'} className="text-xs">
              {task.status.name}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 truncate">{task.description}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>{projectName}</span>
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.priority.color }}
              />
              {task.priority.name}
            </div>
            {task.dueDate && (
              <span>Due: {(() => {
                try {
                  const date = new Date(task.dueDate);
                  return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                } catch {
                  return 'Invalid Date';
                }
              })()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {task.assignedTo && task.assignedTo.name && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{task.assignedTo.name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTask(task);
              setShowTaskDetails(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTask(task);
                setShowCreateTask(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteTask(task.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderTimelineView = (tasks: Task[]) => {
    const sortedTasks = [...tasks].sort((a, b) => {
      const dateA = new Date(a.dueDate || a.createdAt);
      const dateB = new Date(b.dueDate || b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });

    return (
      <div className="space-y-4">
        {sortedTasks.map((task, index) => (
          <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              {index < sortedTasks.length - 1 && (
                <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{task.title}</h3>
                <Badge variant={task.status.id === 'completed' ? 'default' : 'secondary'}>
                  {task.status.name}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>{getProjectName(task.projectId)}</span>
                {task.dueDate && (
                  <span>Due: {(() => {
                    try {
                      const date = new Date(task.dueDate);
                      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                    } catch {
                      return 'Invalid Date';
                    }
                  })()}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTask(task);
                  setShowTaskDetails(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(task);
                    setShowCreateTask(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCalendarView = (tasks: Task[]) => {
    const tasksByDate: { [date: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const date = task.dueDate ? new Date(task.dueDate).toDateString() : 'No Due Date';
      if (!tasksByDate[date]) {
        tasksByDate[date] = [];
      }
      tasksByDate[date].push(task);
    });

    return (
      <div className="space-y-6">
        {Object.entries(tasksByDate).map(([date, dateTasks]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              {date}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dateTasks.map(task => renderTaskCard(task))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pl-8 pr-6 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Manage tasks across all projects</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowNotifications(true)}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadNotifications}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setShowCreateTask(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 w-64"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.project}
            onValueChange={(value) => setFilters({ ...filters, project: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            title="Timeline View"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            title="Calendar View"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tasks by Project */}
      {(() => {
        const tasksByProject = getTasksByProject();
        const filteredTasksByProject: { [projectId: string]: Task[] } = {};
        
        Object.keys(tasksByProject).forEach(projectId => {
          const projectTasks = tasksByProject[projectId].filter(task => {
            if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
              return false;
            }
            if (filters.status !== 'all' && task.status.id !== filters.status) {
              return false;
            }
            if (filters.priority !== 'all' && task.priority.id !== filters.priority) {
              return false;
            }
            if (filters.project !== 'all' && task.projectId !== filters.project) {
              return false;
            }
            if (filters.assignee !== 'all' && task.assignedTo?.id.toString() !== filters.assignee) {
              return false;
            }
            return true;
          });
          
          if (projectTasks.length > 0) {
            filteredTasksByProject[projectId] = projectTasks;
          }
        });

        return Object.keys(filteredTasksByProject).length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.status !== 'all' || filters.project !== 'all'
                ? 'Try adjusting your filters to see more tasks.'
                : 'Get started by creating your first task.'
              }
            </p>
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(filteredTasksByProject).map(projectId => {
              const project = projects.find(p => p.id === projectId);
              const projectTasks = filteredTasksByProject[projectId];
              
              return (
                <div key={projectId} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project?.color || '#3B82F6' }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {project?.name || (project as any)?.projectName || 'Unknown Project'}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className={
                    viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 
                    viewMode === 'list' ? 'space-y-2' : 
                    'space-y-4'
                  }>
                    {viewMode === 'timeline' ? renderTimelineView(projectTasks) :
                     viewMode === 'calendar' ? renderCalendarView(projectTasks) :
                     projectTasks.map(task => 
                       viewMode === 'grid' ? renderTaskCard(task) : renderTaskList(task)
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Modals */}
      <SimpleTaskForm
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onTaskCreated={handleTaskCreated}
        editingTask={selectedTask}
        organizationId={organizationId}
      />

      {/* Properties Sidebar */}
      <TaskPropertiesSidebar
        task={selectedTask}
        isOpen={showPropertiesSidebar}
        onClose={() => setShowPropertiesSidebar(false)}
        onEdit={() => {
          setShowPropertiesSidebar(false);
          setShowCreateTask(true);
        }}
        onDelete={() => {
          if (selectedTask) {
            handleDeleteTask(selectedTask.id);
            setShowPropertiesSidebar(false);
          }
        }}
      />

      <NotificationSystem
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Task Details Modal */}
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedTask ? getProjectColor(selectedTask.projectId) : '#3B82F6' }}
              />
              {selectedTask?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedTask?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6">
              {/* Task Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{selectedTask.priority.name}</div>
                  <div className="text-sm text-gray-500">Priority</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{selectedTask.status.name}</div>
                  <div className="text-sm text-gray-500">Status</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{selectedTask.estimatedHours || 0}h</div>
                  <div className="text-sm text-gray-500">Estimated</div>
                </div>
              </div>

              {/* Project Info */}
              <div className="space-y-2">
                <h4 className="font-medium">Project</h4>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getProjectColor(selectedTask.projectId) }}
                  />
                  <span>{getProjectName(selectedTask.projectId)}</span>
                </div>
              </div>

              {/* Assignee */}
              {selectedTask.assignedTo && selectedTask.assignedTo.name && (
                <div className="space-y-2">
                  <h4 className="font-medium">Assigned To</h4>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{selectedTask.assignedTo.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedTask.assignedTo.name}</div>
                      <div className="text-sm text-gray-500">{selectedTask.assignedTo.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-2">
                <h4 className="font-medium">Timeline</h4>
                <div className="flex items-center gap-4 text-sm">
                  {selectedTask.startDate && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span>Start: {new Date(selectedTask.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedTask.dueDate && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span>Due: {new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowTaskDetails(false);
                    setShowCreateTask(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </Button>
                <Button variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
