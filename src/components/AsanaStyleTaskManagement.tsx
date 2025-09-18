import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
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
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart3,
  GripVertical,
  Move,
  ArrowUpDown,
  Filter as FilterIcon,
  Group,
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
import { SimpleTaskForm } from './SimpleTaskForm';

interface AsanaStyleTaskManagementProps {
  organizationId?: string;
  userRole?: string;
}

export function AsanaStyleTaskManagement({ organizationId, userRole }: AsanaStyleTaskManagementProps) {
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'calendar' | 'board'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  
  // List View States
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Calendar View States
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
        loadUsers()
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

  // ASANA-STYLE LIST VIEW
  const renderListView = () => {
    const filteredTasks = tasks.filter(task => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.project !== 'all' && task.projectId !== filters.project) return false;
      if (filters.assignee !== 'all' && task.assignedTo?.id !== filters.assignee) return false;
      return true;
    });

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Table Header - EXACTLY like Asana */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
            <div className="col-span-1">
              <input type="checkbox" className="rounded border-gray-300" />
            </div>
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Due date</div>
            <div className="col-span-2">Collaborators</div>
            <div className="col-span-1">Projects</div>
            <div className="col-span-1">Task visibility</div>
          </div>
        </div>

        {/* Table Body - EXACTLY like Asana */}
        <div className="divide-y divide-gray-200">
          {filteredTasks.map((task) => (
            <div key={task.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
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

                {/* Task Name - EXACTLY like Asana */}
                <div className="col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
                    {task.description && (
                      <span className="text-xs text-gray-500">• {task.description}</span>
                    )}
                  </div>
                </div>

                {/* Due Date - EXACTLY like Asana */}
                <div className="col-span-2">
                  <span className="text-sm text-gray-600">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                  </span>
                </div>

                {/* Collaborators - EXACTLY like Asana */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    {task.assignedTo && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {task.assignedTo.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-sm text-gray-600">
                      {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Projects - EXACTLY like Asana */}
                <div className="col-span-1">
                  <span className="text-sm text-gray-600">
                    {getProjectName(task.projectId)}
                  </span>
                </div>

                {/* Task Visibility - EXACTLY like Asana */}
                <div className="col-span-1">
                  <span className="text-sm text-gray-600">Public</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ASANA-STYLE CALENDAR VIEW
  const renderCalendarView = () => {
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
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

    const days = getDaysInMonth(calendarDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Calendar Header - EXACTLY like Asana */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </h3>
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

        {/* Calendar Grid - EXACTLY like Asana */}
        <div className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days - EXACTLY like Asana */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const tasksForDay = day ? getTasksForDate(day) : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-200 ${
                    day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {tasksForDay.slice(0, 3).map(task => (
                          <div
                            key={task.id}
                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                            onClick={() => setSelectedTask(task)}
                          >
                            {task.title}
                          </div>
                        ))}
                        {tasksForDay.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{tasksForDay.length - 3} more
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

  // ASANA-STYLE BOARD VIEW (KANBAN)
  const renderBoardView = () => {
    const handleDragStart = (e: React.DragEvent, task: Task) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain');
      const task = tasks.find(t => t.id === taskId);
      
      if (task && task.status !== columnId) {
        try {
          await handleTaskUpdate(taskId, { status: columnId });
          toast({ title: 'Task moved successfully' });
        } catch (error) {
          console.error('Failed to move task:', error);
          toast({ title: 'Failed to move task', variant: 'destructive' });
        }
      }
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Board Header - EXACTLY like Asana */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Board View</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateTask(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add task
            </Button>
          </div>
        </div>

        {/* Board Columns - EXACTLY like Asana */}
        <div className="p-4">
          <div className="flex gap-4 overflow-x-auto">
            {boardColumns.map(column => (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header - EXACTLY like Asana */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{column.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {column.tasks.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateTask(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Column Tasks - EXACTLY like Asana */}
                <div className="space-y-3">
                  {column.tasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="bg-white rounded-lg border border-gray-200 p-3 cursor-move hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900 text-sm">{task.title}</h5>
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ASANA-STYLE TIMELINE VIEW (GANTT CHART)
  const renderTimelineView = () => {
    const getTimelineTasks = () => {
      return tasks
        .filter(task => task.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    };

    const getTimelineDateRange = () => {
      const timelineTasks = getTimelineTasks();
      if (timelineTasks.length === 0) {
        const today = new Date();
        return {
          start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 1 month ahead
        };
      }

      const dates = timelineTasks.map(task => new Date(task.dueDate!));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      return {
        start: new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      };
    };

    const getDaysBetween = (start: Date, end: Date) => {
      const days = [];
      const current = new Date(start);
      while (current <= end) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return days;
    };

    const getTaskPosition = (task: Task) => {
      const { start, end } = getTimelineDateRange();
      const taskDate = new Date(task.dueDate!);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const taskDay = Math.ceil((taskDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const percentage = (taskDay / totalDays) * 100;
      return Math.max(0, Math.min(100, percentage));
    };

    const timelineTasks = getTimelineTasks();
    const { start, end } = getTimelineDateRange();
    const days = getDaysBetween(start, end);

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Timeline Header - EXACTLY like Asana */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Timeline View</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateTask(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add task
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-4">
          {timelineTasks.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks with due dates</h3>
              <p className="text-gray-600 mb-4">Add due dates to your tasks to see them in timeline view</p>
              <Button onClick={() => setShowCreateTask(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline Header with Dates */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-48 text-sm font-medium text-gray-600">Task</div>
                <div className="flex-1 relative">
                  <div className="flex text-xs text-gray-500">
                    {days.slice(0, Math.min(7, days.length)).map((day, index) => (
                      <div key={index} className="flex-1 text-center">
                        {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    ))}
                    {days.length > 7 && (
                      <div className="flex-1 text-center text-gray-400">...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Tasks */}
              <div className="space-y-3">
                {timelineTasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-2">
                    {/* Task Info */}
                    <div className="w-48 flex items-center gap-2">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status).split(' ')[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {getProjectName(task.projectId)}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative h-8 bg-gray-100 rounded">
                      <div
                        className="absolute top-1 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:bg-blue-600 transition-colors"
                        style={{
                          left: `${getTaskPosition(task)}%`,
                          width: '60px',
                          transform: 'translateX(-50%)'
                        }}
                        onClick={() => setSelectedTask(task)}
                      >
                        <span className="truncate px-1">
                          {new Date(task.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Priority Badge */}
                    <div className="w-20">
                      <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
    <div className="space-y-6 pl-8 pr-6 pt-8">
      {/* Header - EXACTLY like Asana */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My tasks</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowCreateTask(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        </div>
      </div>

      {/* View Tabs - EXACTLY like Asana */}
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
          variant={viewMode === 'board' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('board')}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          Board
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
          variant={viewMode === 'timeline' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('timeline')}
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Timeline
        </Button>
      </div>

      {/* Filters and Controls - EXACTLY like Asana */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
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
      {viewMode === 'list' && renderListView()}
      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'board' && renderBoardView()}
      {viewMode === 'timeline' && renderTimelineView()}

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
    </div>
  );
}
