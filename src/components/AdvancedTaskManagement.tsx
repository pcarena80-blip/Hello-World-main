import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  Flag, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Filter,
  Grid3X3,
  List,
  BarChart3,
  Calendar as CalendarIcon,
  GripVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Circle,
  AlertCircle,
  CheckSquare,
  X
} from 'lucide-react';
import { SimpleTaskForm } from './SimpleTaskForm';
import { TimelineView } from './TimelineView';
import { CalendarView } from './CalendarView';
import { StatusBoard } from './StatusBoard';
import { CustomStatusManager } from './CustomStatusManager';
import { FileUpload } from './FileUpload';
import { Task } from '@/types/tasks';

interface AdvancedTaskManagementProps {
  organizationId?: string;
  userRole?: string;
}

interface BoardColumn {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ 
  task, 
  onClose, 
  onUpdate, 
  onDelete, 
  canEdit, 
  canDelete 
}) => {
  if (!task) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto responsive-modal">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Task Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Task Title */}
          <div>
            <h3 className="text-lg font-medium mb-2">{task.title}</h3>
            <p className="text-gray-600 text-sm">{task.description}</p>
          </div>

          {/* Status & Priority */}
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className={`${
                task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                task.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {task.status}
            </Badge>
            <Badge 
              variant="outline" 
              className={`${
                task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {task.priority}
            </Badge>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Assignee</label>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={task.assignee?.avatar} />
                <AvatarFallback>
                  {task.assignee?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{task.assignee?.name || 'Unassigned'}</span>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </div>
          </div>

          {/* Project */}
          {task.project && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Project</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: task.project.color || '#3B82F6' }}
                />
                <span className="text-sm">{task.project.name}</span>
              </div>
            </div>
          )}

          {/* Files */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Task Files</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFileUpload(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
            <div className="border rounded-lg p-3 bg-gray-50">
              <p className="text-sm text-gray-600">
                Upload files related to this task. They will appear in the Files section.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {canEdit && (
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-red-600 hover:text-red-700"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function AdvancedTaskManagement({ organizationId, userRole }: AdvancedTaskManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customStatuses, setCustomStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'timeline' | 'calendar' | 'status-board'>('status-board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  // Board View States
  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>([
    { id: 'todo', name: 'To Do', color: '#6B7280', tasks: [] },
    { id: 'in-progress', name: 'In Progress', color: '#3B82F6', tasks: [] },
    { id: 'review', name: 'Review', color: '#F59E0B', tasks: [] },
    { id: 'done', name: 'Done', color: '#10B981', tasks: [] }
  ]);
  
  // List View States
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  
  // Calendar View States
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  
  // Timeline View States
  const [timelineZoom, setTimelineZoom] = useState<'week' | 'month' | 'quarter'>('month');
  const [timelineStartDate, setTimelineStartDate] = useState(new Date());
  
  // Filters
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
        loadCustomStatuses()
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
      const response = await fetch(`/api/organizations/${organizationId || 'default-org'}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadCustomStatuses = async () => {
    try {
      const response = await fetch('/api/custom-statuses');
      if (response.ok) {
        const data = await response.json();
        setCustomStatuses(data);
      }
    } catch (error) {
      console.error('Failed to load custom statuses:', error);
    }
  };

  const updateBoardColumns = () => {
    const updatedColumns = boardColumns.map(column => ({
      ...column,
      tasks: tasks.filter(task => {
        switch (column.id) {
          case 'todo': return task.status === 'todo' || task.status === 'pending';
          case 'in-progress': return task.status === 'in-progress' || task.status === 'in_progress';
          case 'review': return task.status === 'review' || task.status === 'testing';
          case 'done': return task.status === 'completed' || task.status === 'done';
          default: return false;
        }
      })
    }));
    setBoardColumns(updatedColumns);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    setShowCreateTask(false);
    toast({
      title: "Task Created",
      description: `Task "${newTask.title}" has been created successfully.`,
    });
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    setSelectedTask(null);
    toast({
      title: "Task Updated",
      description: `Task "${updatedTask.title}" has been updated successfully.`,
    });
  };

  const handleTaskDeleted = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setSelectedTask(null);
        toast({
          title: "Task Deleted",
          description: "Task has been deleted successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('application/json', JSON.stringify(task));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskData = e.dataTransfer.getData('application/json');
    const task: Task = JSON.parse(taskData);
    
    const newStatus = targetColumnId === 'todo' ? 'todo' :
                     targetColumnId === 'in-progress' ? 'in-progress' :
                     targetColumnId === 'review' ? 'review' :
                     'completed';

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...task, 
          status: newStatus,
          organizationId 
        })
      });

      if (response.ok) {
        const updatedTask = { ...task, status: newStatus };
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        toast({
          title: "Task Updated",
          description: `Task moved to ${boardColumns.find(c => c.id === targetColumnId)?.name}`,
        });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const matchesSearch = !filters.search || 
        (task.title || task.taskName || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
      const matchesProject = filters.project === 'all' || task.projectId === filters.project;
      const matchesAssignee = filters.assignee === 'all' || task.assigneeId === filters.assignee;

      return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee;
    });
  };

  const renderBoardView = () => {
    const filteredTasks = getFilteredTasks();
    const updatedColumns = boardColumns.map(column => ({
      ...column,
      tasks: filteredTasks.filter(task => {
        switch (column.id) {
          case 'todo': return task.status === 'todo' || task.status === 'pending';
          case 'in-progress': return task.status === 'in-progress' || task.status === 'in_progress';
          case 'review': return task.status === 'review' || task.status === 'testing';
          case 'done': return task.status === 'completed' || task.status === 'done';
          default: return false;
        }
      })
    }));

    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {updatedColumns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{column.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {column.tasks.length}
                  </Badge>
                </div>
                {canEdit && (
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div 
                className="space-y-3 min-h-[400px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {column.tasks.map(task => (
                  <Card 
                    key={task.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDetails(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {task.priority === 'high' && (
                              <Flag className="h-3 w-3 text-red-500" />
                            )}
                            {task.priority === 'medium' && (
                              <Flag className="h-3 w-3 text-yellow-500" />
                            )}
                            {task.priority === 'low' && (
                              <Flag className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          
                          {task.assignee && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignee.avatar} />
                              <AvatarFallback className="text-xs">
                                {task.assignee.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    const filteredTasks = getFilteredTasks();
    const sortedTasks = [...filteredTasks].sort((a, b) => {
      let aValue = a[sortBy as keyof Task];
      let bValue = b[sortBy as keyof Task];
      
      if (sortBy === 'dueDate') {
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return (
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTasks.map(task => (
                <tr 
                  key={task.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedTask(task);
                    setShowTaskDetails(true);
                  }}
                >
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge 
                      variant="outline" 
                      className={`${
                        task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                        task.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {task.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {task.priority === 'high' && (
                        <Flag className="h-4 w-4 text-red-500" />
                      )}
                      {task.priority === 'medium' && (
                        <Flag className="h-4 w-4 text-yellow-500" />
                      )}
                      {task.priority === 'low' && (
                        <Flag className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm capitalize">{task.priority}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {task.dueDate ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No due date</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {task.project ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: task.project.color || '#3B82F6' }}
                        />
                        <span className="text-sm">{task.project.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No project</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    return (
      <TimelineView
        tasks={getFilteredTasks()}
        onTaskUpdate={handleTaskUpdated}
        onTaskClick={(task) => {
          setSelectedTask(task);
          setShowTaskDetails(true);
        }}
        zoom={timelineZoom}
        onZoomChange={setTimelineZoom}
        startDate={timelineStartDate}
        onStartDateChange={setTimelineStartDate}
      />
    );
  };

  const renderCalendarView = () => {
    return (
      <CalendarView
        tasks={getFilteredTasks()}
        onTaskUpdate={handleTaskUpdated}
        onTaskClick={(task) => {
          setSelectedTask(task);
          setShowTaskDetails(true);
        }}
        onCreateTask={(date) => {
          // Set the due date for the new task
          setShowCreateTask(true);
        }}
        view={calendarView}
        onViewChange={setCalendarView}
        currentDate={calendarDate}
        onDateChange={setCalendarDate}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Manage your tasks across different views</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowCreateTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList>
            <TabsTrigger value="board" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="status-board" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Status Board
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="relative">
        {viewMode === 'board' && renderBoardView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'calendar' && renderCalendarView()}
        {viewMode === 'status-board' && (
          <div className="space-y-6">
            <StatusBoard
              items={getFilteredTasks()}
              onItemUpdate={handleTaskUpdated}
              onItemClick={(task) => {
                setSelectedTask(task);
                setShowTaskDetails(true);
              }}
              onItemDelete={canDelete ? handleTaskDeleted : undefined}
              onCreateItem={(statusId) => {
                setShowCreateTask(true);
              }}
              canEdit={canEdit}
              canDelete={canDelete}
              itemType="task"
              customStatuses={customStatuses}
            />
            <CustomStatusManager
              statuses={customStatuses}
              onStatusUpdate={setCustomStatuses}
              canEdit={canEdit}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <SimpleTaskForm
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onTaskCreated={handleTaskCreated}
        organizationId={organizationId}
      />

      {/* Task Detail Panel */}
      {showTaskDetails && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setShowTaskDetails(false)}
          onUpdate={handleTaskUpdated}
          onDelete={handleTaskDeleted}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* File Upload Dialog */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Files to Task</DialogTitle>
            <DialogDescription>
              Upload files related to "{selectedTask?.title}". These files will appear in the Files section.
            </DialogDescription>
          </DialogHeader>
          <FileUpload
            taskId={selectedTask?.id}
            onUploadComplete={(file) => {
              console.log('File uploaded:', file);
              setShowFileUpload(false);
            }}
            onUploadError={(error) => {
              console.error('Upload error:', error);
            }}
            maxFileSize={50}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
