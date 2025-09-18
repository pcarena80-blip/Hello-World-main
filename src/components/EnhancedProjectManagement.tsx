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
  FolderKanban,
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
  CheckSquare,
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
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from './FileUpload';
import { Project, Task, Milestone, Notification } from '@/types/tasks';
import { ComprehensiveProjectForm } from './ComprehensiveProjectForm';
import { SimpleTaskForm } from './SimpleTaskForm';
import { NotificationSystem } from './NotificationSystem';
import { ProjectPermissionsManager } from './ProjectPermissionsManager';
import { StatusBoard } from './StatusBoard';
import { CustomStatusManager } from './CustomStatusManager';
import { usePermissions } from '@/hooks/usePermissions';

interface EnhancedProjectManagementProps {
  organizationId?: string;
  userRole?: string;
}

export function EnhancedProjectManagement({ organizationId, userRole }: EnhancedProjectManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canEditProject, canDeleteProject, canViewProject } = usePermissions();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [customStatuses, setCustomStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline' | 'calendar' | 'board' | 'status-board'>('status-board');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all'
  });

  const canEdit = ['super_admin', 'admin', 'manager'].includes(userRole || '');
  const canDelete = ['super_admin', 'admin'].includes(userRole || '');

  useEffect(() => {
    loadData();
  }, [organizationId]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectTasks(selectedProject.id);
      loadProjectMilestones(selectedProject.id);
    }
  }, [selectedProject]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProjects(),
        loadTasks(),
        loadNotifications(),
        loadCustomStatuses()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      console.log('Loading projects for organizationId:', organizationId);
      const response = await fetch(`/api/projects?organizationId=${organizationId || 'default-org'}`);
      console.log('Projects API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded projects data:', data);
        
        // Map project data to expected format
        const mappedProjects = data.map((project: any) => ({
          ...project,
          name: project.projectName || project.name, // Use projectName if available, fallback to name
          id: project.id,
          status: project.status || 'upcoming' // Ensure status is set
        }));
        
        console.log('Mapped projects:', mappedProjects);
        console.log('Setting projects in state...');
        setProjects(mappedProjects);
      } else {
        console.error('Failed to load projects - response not ok:', response.status);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
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

  const loadProjectTasks = async (projectId: string) => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(prev => [...prev.filter(t => t.projectId !== projectId), ...data]);
      }
    } catch (error) {
      console.error('Failed to load project tasks:', error);
    }
  };

  const loadProjectMilestones = async (projectId: string) => {
    try {
      const response = await fetch(`/api/milestones?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data);
      }
    } catch (error) {
      console.error('Failed to load project milestones:', error);
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

  const handleProjectCreated = (project: Project) => {
    setProjects(prev => [...prev, project]);
    setShowCreateProject(false);
    toast({
      title: "Project Created",
      description: `Project "${project.name}" has been created successfully.`,
    });
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(prev => prev.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    ));
    setSelectedProject(null);
    toast({
      title: "Project Updated",
      description: `Project "${updatedProject.name}" has been updated successfully.`,
    });
  };

  const handleDeleteProject = (project: Project) => {
    if (!canDelete) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete projects.",
        variant: "destructive",
      });
      return;
    }

    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    console.log('Attempting to delete project:', {
      projectId: projectToDelete.id,
      organizationId: organizationId,
      projectName: projectToDelete.name || projectToDelete.projectName
    });

    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organizationId,
          deletedBy: 'current-user' // TODO: Get actual user ID
        })
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        toast({
          title: "Project Deleted",
          description: `Project "${projectToDelete.name || projectToDelete.projectName}" has been deleted successfully.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  const handlePermissionsUpdate = (permissions: Project['permissions']) => {
    if (selectedProject) {
      const updatedProject = { ...selectedProject, permissions };
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
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

  const getProjectProgress = (project: Project) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(t => t.status.id === 'completed').length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const projectMilestones = milestones.filter(m => m.projectId === project.id);
    
    return {
      totalTasks: projectTasks.length,
      completedTasks: projectTasks.filter(t => t.status.id === 'completed').length,
      inProgressTasks: projectTasks.filter(t => t.status.id === 'in-progress').length,
      overdueTasks: projectTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status.id !== 'completed';
      }).length,
      milestones: projectMilestones.length,
      completedMilestones: projectMilestones.filter(m => m.status === 'completed').length
    };
  };

  const filteredProjects = projects.filter(project => {
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && project.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && project.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  const renderProjectCard = (project: Project) => {
    const stats = getProjectStats(project);
    const progress = getProjectProgress(project);
    
    return (
      <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <div>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {project.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                {project.status.replace('-', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-gray-400" />
              <span>{stats.completedTasks}/{stats.totalTasks} tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-400" />
              <span>{stats.completedMilestones}/{stats.milestones} milestones</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {project.startDate 
                ? `${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.dueDate).toLocaleDateString()}`
                : `Due ${new Date(project.dueDate).toLocaleDateString()}`
              }
            </span>
          </div>

          {/* Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">{project.team.length} members</span>
            </div>
            <div className="flex -space-x-2">
              {project.team.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
              {project.team.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-500">+{project.team.length - 3}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProject(project);
                setShowProjectDetails(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProject(project);
                  setShowCreateTask(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteProject(project)}
                  title="Delete Project"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {canEditProject(project) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProject(project);
                    setShowPermissions(true);
                  }}
                  title="Manage Permissions"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Permissions
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProjectList = (project: Project) => {
    const stats = getProjectStats(project);
    const progress = getProjectProgress(project);
    
    return (
      <div key={project.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
        <div 
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{project.name}</h3>
            {project.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />}
            <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
              {project.status.replace('-', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 truncate">{project.description}</p>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="text-center">
            <div className="font-medium">{progress}%</div>
            <div className="text-xs">Progress</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{stats.completedTasks}/{stats.totalTasks}</div>
            <div className="text-xs">Tasks</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{stats.completedMilestones}/{stats.milestones}</div>
            <div className="text-xs">Milestones</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{project.team.length}</div>
            <div className="text-xs">Members</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{new Date(project.dueDate).toLocaleDateString()}</div>
            <div className="text-xs">Due Date</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedProject(project);
              setShowProjectDetails(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedProject(project);
              setShowCreateTask(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDeleteProject(project)}
              title="Delete Project"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {canEditProject(project) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedProject(project);
                setShowPermissions(true);
              }}
              title="Manage Permissions"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // New view render functions
  const renderTimelineView = (projects: Project[]) => {
    const sortedProjects = projects.sort((a, b) => new Date(a.startDate || a.createdAt).getTime() - new Date(b.startDate || b.createdAt).getTime());
    
    return (
      <div className="space-y-6">
        {sortedProjects.map(project => {
          const stats = getProjectStats(project);
          const progress = Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100);
          
          return (
            <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div 
                    className="w-4 h-4 rounded-full mb-2"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="w-px h-16 bg-gray-200"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    {project.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {project.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{project.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="text-center">
                      <div className="font-medium">{progress}%</div>
                      <div className="text-xs">Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{stats.completedTasks}/{stats.totalTasks}</div>
                      <div className="text-xs">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{new Date(project.dueDate).toLocaleDateString()}</div>
                      <div className="text-xs">Due Date</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCalendarView = (projects: Project[]) => {
    const projectsByDate = projects.reduce((acc, project) => {
      const date = new Date(project.dueDate).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(project);
      return acc;
    }, {} as { [key: string]: Project[] });

    return (
      <div className="space-y-6">
        {Object.entries(projectsByDate).map(([date, dateProjects]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              {date}
            </h3>
            <div className="responsive-grid responsive-grid-3">
              {dateProjects.map(project => {
                const stats = getProjectStats(project);
                const progress = Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100);
                
                return (
                  <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{project.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{progress}% complete</span>
                      <span>{stats.totalTasks} tasks</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBoardView = (projects: Project[]) => {
    const statusGroups = {
      'planned': projects.filter(p => p.status === 'planned'),
      'in-progress': projects.filter(p => p.status === 'in-progress'),
      'completed': projects.filter(p => p.status === 'completed'),
      'on-hold': projects.filter(p => p.status === 'on-hold'),
      'cancelled': projects.filter(p => p.status === 'cancelled')
    };

    return (
      <div className="responsive-grid responsive-grid-4">
        {Object.entries(statusGroups).map(([status, statusProjects]) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900 capitalize">{status.replace('-', ' ')}</h3>
              <Badge variant="outline" className="text-xs">{statusProjects.length}</Badge>
            </div>
            <div className="space-y-3">
              {statusProjects.map(project => {
                const stats = getProjectStats(project);
                const progress = Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100);
                
                return (
                  <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="font-medium text-gray-900 text-sm">{project.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{project.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{stats.totalTasks} tasks</span>
                        <span>{project.team.length} members</span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Manage projects, tasks, and team collaboration</p>
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
            onClick={() => setShowCreateProject(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
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
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.priority}
            onValueChange={(value) => setFilters({ ...filters, priority: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
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
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'board' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('board')}
            title="Board View"
          >
            <FolderKanban className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'status-board' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('status-board')}
            title="Status Board View"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {filters.search || filters.status !== 'all' || filters.priority !== 'all'
              ? 'Try adjusting your filters to see more projects.'
              : 'Get started by creating your first project.'
            }
          </p>
          <Button onClick={() => setShowCreateProject(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'status-board' ? (
          <div className="space-y-6">
            {console.log('Rendering StatusBoard with projects:', filteredProjects)}
            <StatusBoard
              items={filteredProjects}
              onItemUpdate={handleProjectUpdated}
              onItemClick={(project) => {
                setSelectedProject(project);
                setShowProjectDetails(true);
              }}
              onItemDelete={canDelete ? handleDeleteProject : undefined}
              onCreateItem={(statusId) => {
                setShowCreateProject(true);
              }}
              canEdit={canEdit}
              canDelete={canDelete}
              itemType="project"
              customStatuses={customStatuses}
            />
            <CustomStatusManager
              statuses={customStatuses}
              onStatusUpdate={setCustomStatuses}
              canEdit={canEdit}
            />
          </div>
        ) : (
          <div className={
            viewMode === 'grid' ? 'responsive-project-grid' :
            viewMode === 'list' ? 'space-y-4' :
            viewMode === 'timeline' ? 'space-y-6' :
            viewMode === 'calendar' ? 'space-y-6' :
            viewMode === 'board' ? 'space-y-6' : 'space-y-4'
          }>
            {viewMode === 'timeline' ? renderTimelineView(filteredProjects) :
             viewMode === 'calendar' ? renderCalendarView(filteredProjects) :
             viewMode === 'board' ? renderBoardView(filteredProjects) :
             filteredProjects.map(project => 
              viewMode === 'grid' ? renderProjectCard(project) : renderProjectList(project)
            )}
          </div>
          )}
        </>
      )}

      {/* Modals */}
      <ComprehensiveProjectForm
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onProjectCreated={handleProjectCreated}
        organizationId={organizationId}
      />

      <SimpleTaskForm
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onTaskCreated={handleTaskCreated}
        organizationId={organizationId}
      />

      <NotificationSystem
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {selectedProject && (
        <ProjectPermissionsManager
          isOpen={showPermissions}
          onClose={() => setShowPermissions(false)}
          project={selectedProject}
          onPermissionsUpdate={handlePermissionsUpdate}
          availableUsers={[]} // TODO: Load available users
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the project "{projectToDelete?.name}"? This action cannot be undone and will permanently remove the project and all its associated tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteProject}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Details Modal */}
      <Dialog open={showProjectDetails} onOpenChange={setShowProjectDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedProject?.color }}
              />
              {selectedProject?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedProject?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-6">
              {/* Project Stats */}
              <div className="grid grid-cols-4 gap-4">
                {(() => {
                  const stats = getProjectStats(selectedProject);
                  return [
                    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare },
                    { label: 'Completed', value: stats.completedTasks, icon: CheckCircle },
                    { label: 'In Progress', value: stats.inProgressTasks, icon: Clock },
                    { label: 'Overdue', value: stats.overdueTasks, icon: AlertCircle }
                  ];
                })().map(({ label, value, icon: Icon }) => (
                  <div key={label} className="text-center p-4 border rounded-lg">
                    <Icon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Project Progress</span>
                  <span className="text-sm text-gray-500">{getProjectProgress(selectedProject)}%</span>
                </div>
                <Progress value={getProjectProgress(selectedProject)} className="h-3" />
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <h4 className="font-medium">Timeline</h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span>
                      {selectedProject.startDate 
                        ? `Start: ${new Date(selectedProject.startDate).toLocaleDateString()}`
                        : 'No start date'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span>Due: {new Date(selectedProject.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Team */}
              <div className="space-y-2">
                <h4 className="font-medium">Team Members</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.team.map((member) => (
                    <div key={member.id} className="flex items-center gap-2 p-2 border rounded-lg">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Files */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Project Files</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFileUpload(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Upload files related to this project. They will appear in the Files section.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowProjectDetails(false);
                    setShowCreateTask(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
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

      {/* File Upload Dialog */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Files to Project</DialogTitle>
            <DialogDescription>
              Upload files related to "{selectedProject?.name}". These files will appear in the Files section.
            </DialogDescription>
          </DialogHeader>
          <FileUpload
            projectId={selectedProject?.id}
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
