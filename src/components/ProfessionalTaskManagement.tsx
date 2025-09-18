import React, { useState, useEffect, useRef } from 'react';
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
  BarChart3,
  GripVertical,
  Move,
  ArrowUpDown,
  Filter as FilterIcon,
  Group,
  Settings,
  X,
  Save,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  ZoomIn,
  ZoomOut,
  Link2,
  UserPlus,
  FileText,
  Image,
  Video,
  File
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Task, Project, Notification } from '@/types/tasks';
import { EnhancedPropertiesSidebar } from './EnhancedPropertiesSidebar';
import { SimpleTaskForm } from './SimpleTaskForm';
import { NotificationSystem } from './NotificationSystem';

interface ProfessionalTaskManagementProps {
  organizationId?: string;
  userRole?: string;
}

export function ProfessionalTaskManagement({ organizationId, userRole }: ProfessionalTaskManagementProps) {
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'calendar' | 'board'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showPropertiesSidebar, setShowPropertiesSidebar] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // List View States
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [groupBy, setGroupBy] = useState<string>('status');
  
  // Timeline View States
  const [timelineZoom, setTimelineZoom] = useState<'week' | 'month' | 'quarter'>('month');
  const [timelineStartDate, setTimelineStartDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // Calendar View States
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Board View States
  const [boardColumns, setBoardColumns] = useState([
    { id: 'todo', name: 'To Do', color: '#6B7280', tasks: [] },
    { id: 'in-progress', name: 'In Progress', color: '#3B82F6', tasks: [] },
    { id: 'review', name: 'Review', color: '#F59E0B', tasks: [] },
    { id: 'done', name: 'Done', color: '#10B981', tasks: [] }
  ]);
  
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

  useEffect(() => {
    if (viewMode === 'board') {
      updateBoardColumns();
    }
  }, [tasks, viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTasks(),
        loadProjects(),
        loadUsers(),
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

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
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

  const updateBoardColumns = () => {
    const updatedColumns = boardColumns.map(column => ({
      ...column,
      tasks: tasks.filter(task => task.status === column.id)
    }));
    setBoardColumns(updatedColumns);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        ));
        toast({ title: 'Task updated successfully' });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({ title: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        toast({ title: 'Task deleted successfully' });
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowPropertiesSidebar(true);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || project?.projectName || 'Unknown Project';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown User';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'text-gray-600 bg-gray-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      case 'done': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // List View Component
  const renderListView = () => {
    const filteredTasks = tasks.filter(task => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.project !== 'all' && task.projectId !== filters.project) return false;
      if (filters.assignee !== 'all' && task.assignedTo?.id !== filters.assignee) return false;
      return true;
    });

    const sortedTasks = [...filteredTasks].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate || 0).getTime();
          bValue = new Date(b.dueDate || 0).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
            <div className="col-span-1">
              <input type="checkbox" className="rounded border-gray-300" />
            </div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Assignee</div>
            <div className="col-span-1">Due Date</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Project</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {sortedTasks.map((task) => (
            <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Checkbox */}
                <div className="col-span-1">
                  <input 
                    type="checkbox" 
                    checked={task.status === 'done'}
                    onChange={(e) => handleTaskUpdate(task.id, { 
                      status: e.target.checked ? 'done' : 'todo' 
                    })}
                    className="rounded border-gray-300"
                  />
                </div>

                {/* Task Name */}
                <div className="col-span-4">
                  {editingTask === task.id && editingField === 'title' ? (
                    <Input
                      value={task.title}
                      onChange={(e) => handleTaskUpdate(task.id, { title: e.target.value })}
                      onBlur={() => {
                        setEditingTask(null);
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingTask(null);
                          setEditingField(null);
                        }
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTask(task.id);
                        setEditingField('title');
                      }}
                      className="text-left text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {task.title}
                    </button>
                  )}
                </div>

                {/* Assignee */}
                <div className="col-span-2">
                  {editingTask === task.id && editingField === 'assignee' ? (
                    <select
                      value={task.assignedTo?.id || ''}
                      onChange={(e) => {
                        const assignee = users.find(u => u.id === e.target.value);
                        handleTaskUpdate(task.id, { assignedTo: assignee });
                      }}
                      onBlur={() => {
                        setEditingTask(null);
                        setEditingField(null);
                      }}
                      className="h-8 text-sm border border-gray-300 rounded px-2"
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTask(task.id);
                        setEditingField('assignee');
                      }}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      {task.assignedTo ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {task.assignedTo.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{task.assignedTo.name}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Due Date */}
                <div className="col-span-1">
                  {editingTask === task.id && editingField === 'dueDate' ? (
                    <Input
                      type="date"
                      value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleTaskUpdate(task.id, { dueDate: e.target.value })}
                      onBlur={() => {
                        setEditingTask(null);
                        setEditingField(null);
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTask(task.id);
                        setEditingField('dueDate');
                      }}
                      className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                    </button>
                  )}
                </div>

                {/* Priority */}
                <div className="col-span-1">
                  {editingTask === task.id && editingField === 'priority' ? (
                    <select
                      value={task.priority}
                      onChange={(e) => handleTaskUpdate(task.id, { priority: e.target.value })}
                      onBlur={() => {
                        setEditingTask(null);
                        setEditingField(null);
                      }}
                      className="h-8 text-sm border border-gray-300 rounded px-2"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTask(task.id);
                        setEditingField('priority');
                      }}
                      className="text-sm hover:text-blue-600 transition-colors"
                    >
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </button>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1">
                  {editingTask === task.id && editingField === 'status' ? (
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskUpdate(task.id, { status: e.target.value })}
                      onBlur={() => {
                        setEditingTask(null);
                        setEditingField(null);
                      }}
                      className="h-8 text-sm border border-gray-300 rounded px-2"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTask(task.id);
                        setEditingField('status');
                      }}
                      className="text-sm hover:text-blue-600 transition-colors"
                    >
                      <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </Badge>
                    </button>
                  )}
                </div>

                {/* Project */}
                <div className="col-span-1">
                  <span className="text-sm text-gray-600">
                    {getProjectName(task.projectId)}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTaskClick(task)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTaskDelete(task.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Timeline View Component (Gantt Chart)
  const renderTimelineView = () => {
    const filteredTasks = tasks.filter(task => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });

    const getTimelineWidth = () => {
      switch (timelineZoom) {
        case 'week': return 7 * 120; // 7 days * 120px per day
        case 'month': return 30 * 30; // 30 days * 30px per day
        case 'quarter': return 90 * 15; // 90 days * 15px per day
        default: return 30 * 30;
      }
    };

    const getTaskPosition = (task: Task) => {
      const startDate = new Date(task.startDate || task.createdAt);
      const endDate = new Date(task.dueDate || startDate);
      const timelineStart = new Date(timelineStartDate);
      
      const daysDiff = Math.floor((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const left = daysDiff * (timelineZoom === 'week' ? 120 : timelineZoom === 'month' ? 30 : 15);
      const width = duration * (timelineZoom === 'week' ? 120 : timelineZoom === 'month' ? 30 : 15);
      
      return { left: Math.max(0, left), width: Math.max(80, width) };
    };

    const getTaskColor = (task: Task) => {
      switch (task.priority) {
        case 'high': return 'bg-red-500 hover:bg-red-600';
        case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
        case 'low': return 'bg-green-500 hover:bg-green-600';
        default: return 'bg-blue-500 hover:bg-blue-600';
      }
    };

    const getTaskStatusColor = (task: Task) => {
      switch (task.status) {
        case 'done': return 'bg-green-500 hover:bg-green-600';
        case 'in-progress': return 'bg-blue-500 hover:bg-blue-600';
        case 'review': return 'bg-yellow-500 hover:bg-yellow-600';
        default: return 'bg-gray-500 hover:bg-gray-600';
      }
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Timeline Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Timeline View (Gantt Chart)</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={timelineZoom === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimelineZoom('week')}
                >
                  Week
                </Button>
                <Button
                  variant={timelineZoom === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimelineZoom('month')}
                >
                  Month
                </Button>
                <Button
                  variant={timelineZoom === 'quarter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimelineZoom('quarter')}
                >
                  Quarter
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTimelineStartDate(new Date(timelineStartDate.getTime() - (timelineZoom === 'week' ? 7 : timelineZoom === 'month' ? 30 : 90) * 24 * 60 * 60 * 1000))}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTimelineStartDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTimelineStartDate(new Date(timelineStartDate.getTime() + (timelineZoom === 'week' ? 7 : timelineZoom === 'month' ? 30 : 90) * 24 * 60 * 60 * 1000))}
              >
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Timeline Grid */}
          <div className="relative overflow-x-auto">
            <div className="h-8 bg-gray-50 border-b border-gray-200 flex min-w-max">
              {Array.from({ length: timelineZoom === 'week' ? 7 : timelineZoom === 'month' ? 30 : 90 }, (_, i) => {
                const date = new Date(timelineStartDate);
                date.setDate(date.getDate() + i);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={i}
                    className={`flex-1 border-r border-gray-200 flex items-center justify-center text-xs ${
                      isToday ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600'
                    }`}
                    style={{ minWidth: timelineZoom === 'week' ? '120px' : timelineZoom === 'month' ? '30px' : '15px' }}
                  >
                    {timelineZoom === 'week' ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                     timelineZoom === 'month' ? date.getDate() :
                     date.getDate() % 7 === 0 ? date.getDate() : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline Tasks */}
        <div className="p-4">
          <div className="space-y-3 overflow-x-auto">
            {filteredTasks.map((task, index) => {
              const position = getTaskPosition(task);
              const startDate = new Date(task.startDate || task.createdAt);
              const endDate = new Date(task.dueDate || startDate);
              
              return (
                <div key={task.id} className="relative h-16 flex items-center">
                  {/* Task Info */}
                  <div className="w-64 flex-shrink-0 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={task.status === 'done'}
                          onChange={(e) => handleTaskUpdate(task.id, { 
                            status: e.target.checked ? 'done' : 'todo' 
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-900">{task.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {task.assignedTo && (
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {task.assignedTo.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative min-h-[40px]">
                    <div
                      className={`absolute top-2 h-8 rounded px-3 py-1 cursor-move hover:shadow-md transition-all duration-200 flex items-center text-white text-sm font-medium ${getTaskStatusColor(task)}`}
                      style={{
                        left: `${position.left}px`,
                        width: `${position.width}px`,
                        minWidth: '80px'
                      }}
                      draggable
                      onDragStart={(e) => setDraggedTask(task)}
                      onClick={() => handleTaskClick(task)}
                    >
                      <GripVertical className="h-4 w-4 mr-2 opacity-70" />
                      <span className="truncate flex-1">{task.title}</span>
                      <div className="flex items-center gap-1 ml-2">
                        <span className="text-xs opacity-80">
                          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs opacity-80">-</span>
                        <span className="text-xs opacity-80">
                          {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Calendar View Component
  const renderCalendarView = () => {
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }
      
      return days;
    };

    const getTasksForDate = (date: Date) => {
      return tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString();
      });
    };

    const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
      setDraggedTask(task);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleTaskDrop = (e: React.DragEvent, targetDate: Date) => {
      e.preventDefault();
      if (draggedTask) {
        handleTaskUpdate(draggedTask.id, { dueDate: targetDate.toISOString().split('T')[0] });
        setDraggedTask(null);
      }
    };

    const handleDateDoubleClick = (date: Date) => {
      // Create a new task for this date
      setShowCreateTask(true);
    };

    const getTaskColor = (task: Task) => {
      switch (task.priority) {
        case 'high': return 'bg-red-100 text-red-800 border-red-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-blue-100 text-blue-800 border-blue-200';
      }
    };

    const getTaskStatusColor = (task: Task) => {
      switch (task.status) {
        case 'done': return 'bg-green-100 text-green-800 border-green-200';
        case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const days = getDaysInMonth(calendarDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Calendar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Calendar View</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={calendarView === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarView('month')}
                >
                  Month
                </Button>
                <Button
                  variant={calendarView === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarView('week')}
                >
                  Week
                </Button>
                <Button
                  variant={calendarView === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalendarView('day')}
                >
                  Day
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCalendarDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              >
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const tasksForDay = day ? getTasksForDate(day) : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-gray-200 ${
                    day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => day && handleTaskDrop(e, day)}
                  onDoubleClick={() => day && handleDateDoubleClick(day)}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {tasksForDay.slice(0, 4).map(task => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleTaskDragStart(e, task)}
                            className={`text-xs p-2 rounded border cursor-move hover:shadow-sm transition-all duration-200 ${getTaskStatusColor(task)}`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <input 
                                type="checkbox" 
                                checked={task.status === 'done'}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleTaskUpdate(task.id, { 
                                    status: e.target.checked ? 'done' : 'todo' 
                                  });
                                }}
                                className="rounded border-gray-300 h-3 w-3"
                              />
                              <span className="font-medium truncate">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {task.assignedTo && (
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-xs">
                                    {task.assignedTo.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {tasksForDay.length > 4 && (
                          <div className="text-xs text-gray-500 p-1">
                            +{tasksForDay.length - 4} more
                          </div>
                        )}
                        {tasksForDay.length === 0 && (
                          <div className="text-xs text-gray-400 p-1">
                            Double-click to add task
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Board View Component (Kanban)
  const renderBoardView = () => {
    const handleDragStart = (e: React.DragEvent, task: Task) => {
      setDraggedTask(task);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      if (draggedTask) {
        handleTaskUpdate(draggedTask.id, { status: columnId });
        setDraggedTask(null);
      }
    };

    const addNewColumn = () => {
      const newColumn = {
        id: `column-${Date.now()}`,
        name: 'New Column',
        color: '#6B7280',
        tasks: []
      };
      setBoardColumns([...boardColumns, newColumn]);
    };

    const updateColumnName = (columnId: string, newName: string) => {
      setBoardColumns(prev => prev.map(col => 
        col.id === columnId ? { ...col, name: newName } : col
      ));
    };

    const deleteColumn = (columnId: string) => {
      if (boardColumns.length > 1) {
        setBoardColumns(prev => prev.filter(col => col.id !== columnId));
      }
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Board Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Board View (Kanban)</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addNewColumn}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateTask(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </div>

        {/* Board Columns */}
        <div className="p-4">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {boardColumns.map(column => (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 min-h-[500px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: column.color }}
                    />
                    <input
                      value={column.name}
                      onChange={(e) => updateColumnName(column.id, e.target.value)}
                      className="font-medium text-gray-900 bg-transparent border-none outline-none flex-1"
                      onBlur={(e) => {
                        if (!e.target.value.trim()) {
                          updateColumnName(column.id, 'Untitled Column');
                        }
                      }}
                    />
                    <Badge variant="outline" className="text-xs">
                      {column.tasks.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateTask(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {boardColumns.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteColumn(column.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Column Tasks */}
                <div className="space-y-3 flex-1">
                  {column.tasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="bg-white rounded-lg border border-gray-200 p-3 cursor-move hover:shadow-md transition-all duration-200 group"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <input 
                            type="checkbox" 
                            checked={task.status === 'done'}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleTaskUpdate(task.id, { 
                                status: e.target.checked ? 'done' : 'todo' 
                              });
                            }}
                            className="rounded border-gray-300 h-4 w-4"
                          />
                          <h5 className="font-medium text-gray-900 text-sm flex-1">{task.title}</h5>
                        </div>
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.assignedTo && (
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {task.assignedTo.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskDelete(task.id);
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Empty State */}
                  {column.tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-sm">No tasks in this column</div>
                      <div className="text-xs mt-1">Drag tasks here or click + to add</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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
    <div className="space-y-6 pl-8 pr-6 pt-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">Manage your tasks and stay organized</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotifications(true)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
          <Button
            onClick={() => setShowCreateTask(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
        >
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
        <Button
          variant={viewMode === 'timeline' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('timeline')}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Timeline
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('calendar')}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Calendar
        </Button>
        <Button
          variant={viewMode === 'board' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('board')}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          Board
        </Button>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline" size="sm">
          <FilterIcon className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Sort
        </Button>
        <Button variant="outline" size="sm">
          <Group className="h-4 w-4 mr-2" />
          Group
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="transition-all duration-300 ease-in-out">
        {viewMode === 'list' && (
          <div className="animate-in fade-in-0 slide-in-from-left-4 duration-300">
            {renderListView()}
          </div>
        )}
        {viewMode === 'timeline' && (
          <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            {renderTimelineView()}
          </div>
        )}
        {viewMode === 'calendar' && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            {renderCalendarView()}
          </div>
        )}
        {viewMode === 'board' && (
          <div className="animate-in fade-in-0 slide-in-from-top-4 duration-300">
            {renderBoardView()}
          </div>
        )}
      </div>

      {/* Modals */}
      <SimpleTaskForm
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onTaskCreated={(task) => {
          setTasks(prev => [...prev, task]);
          setShowCreateTask(false);
        }}
        organizationId={organizationId}
      />

      <NotificationSystem
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={(notificationId) => {
          setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
          );
          setUnreadNotifications(prev => Math.max(0, prev - 1));
        }}
      />

      {/* Enhanced Properties Sidebar */}
      {showPropertiesSidebar && selectedTask && (
        <EnhancedPropertiesSidebar
          task={selectedTask}
          isOpen={showPropertiesSidebar}
          onClose={() => {
            setShowPropertiesSidebar(false);
            setSelectedTask(null);
          }}
          onUpdate={(updatedTask) => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
          }}
          onDelete={(taskId) => {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setShowPropertiesSidebar(false);
            setSelectedTask(null);
          }}
          projects={projects}
          users={users}
        />
      )}
    </div>
  );
}
