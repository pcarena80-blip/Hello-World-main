import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Plus,
  Target,
  CheckSquare,
  Calendar,
  Users,
  FolderKanban,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  TrendingUp,
  Activity,
  Mail
} from 'lucide-react';

interface Project {
  id: string;
  projectName: string;
  status: string;
  priority: string;
  deadline: string;
  startDate?: string;
  color: string;
  tasks: Task[];
}

interface Task {
  id: string;
  taskName: string;
  status: string;
  priority: string;
  deadline: string;
  assignedTo: string;
  createdAt: string;
}

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  completedProjects: number;
  inProgressProjects: number;
  overdueProjects: number;
  averageProjectProgress: number;
}

export function AsanaHome() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    inProgressTasks: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    overdueProjects: 0,
    averageProjectProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, tasksResponse, invitationsResponse] = await Promise.all([
        fetch(`/api/projects?organizationId=${user?.organizationId || 'default-org'}`),
        fetch(`/api/tasks?organizationId=${user?.organizationId || 'default-org'}`),
        fetch(`/api/invitations/${user?.id}`)
      ]);

      const projectsData = projectsResponse.ok ? await projectsResponse.json() : [];
      const tasksData = tasksResponse.ok ? await tasksResponse.json() : [];
      const invitationsData = invitationsResponse.ok ? await invitationsResponse.json() : { invitations: [] };

      setProjects(projectsData);
      setTasks(tasksData);
      setPendingInvitations(invitationsData.invitations || []);

      // Calculate stats
      const now = new Date();
      const stats: DashboardStats = {
        totalProjects: projectsData.length,
        totalTasks: tasksData.length,
        completedTasks: tasksData.filter((task: Task) => task.status === 'Completed' || task.status === 'Done').length,
        pendingTasks: tasksData.filter((task: Task) => task.status === 'Pending' || task.status === 'Not Started').length,
        overdueTasks: tasksData.filter((task: Task) => {
          if (!task.deadline) return false;
          return new Date(task.deadline) < now && task.status !== 'Completed' && task.status !== 'Done';
        }).length,
        inProgressTasks: tasksData.filter((task: Task) => task.status === 'In Progress' || task.status === 'Active').length,
        completedProjects: projectsData.filter((project: Project) => project.status === 'Completed' || project.status === 'Done').length,
        inProgressProjects: projectsData.filter((project: Project) => project.status === 'In Progress' || project.status === 'Active').length,
        overdueProjects: projectsData.filter((project: Project) => {
          if (!project.deadline) return false;
          return new Date(project.deadline) < now && project.status !== 'Completed' && project.status !== 'Done';
        }).length,
        averageProjectProgress: 0
      };

      // Calculate average project progress
      if (projectsData.length > 0) {
        const totalProgress = projectsData.reduce((sum: number, project: Project) => {
          if (project.tasks && project.tasks.length > 0) {
            const completedTasks = project.tasks.filter((task: Task) => 
              task.status === 'Completed' || task.status === 'Done'
            ).length;
            return sum + (completedTasks / project.tasks.length) * 100;
          }
          return sum;
        }, 0);
        stats.averageProjectProgress = totalProgress / projectsData.length;
      }

      setStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'text-green-600 bg-green-100';
      case 'in progress':
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
      case 'not started':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's your organization performance overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Invitations Banner */}
      {pendingInvitations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-800">
                  You have {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-amber-700 text-sm">
                  {pendingInvitations.map(inv => inv.organization.name).join(', ')} invited you to join their organization{pendingInvitations.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => {
                // Navigate to organizations section
                const event = new CustomEvent('navigateToSection', { detail: 'organizations' });
                window.dispatchEvent(event);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              View Invitations
            </Button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor('In Progress')}>
                {stats.inProgressProjects} Active
              </Badge>
              <Badge className={getStatusColor('Completed')}>
                {stats.completedProjects} Done
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTasks}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor('Completed')}>
                {stats.completedTasks} Done
              </Badge>
              <Badge className={getStatusColor('Pending')}>
                {stats.pendingTasks} Pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueTasks + stats.overdueProjects}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="text-red-600 bg-red-100">
                {stats.overdueTasks} Tasks
              </Badge>
              <Badge className="text-red-600 bg-red-100">
                {stats.overdueProjects} Projects
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(stats.averageProjectProgress)}%
            </div>
            <Progress value={stats.averageProjectProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Task Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Task Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.completedTasks}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.inProgressTasks}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.pendingTasks}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalTasks > 0 ? (stats.pendingTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.overdueTasks}</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalTasks > 0 ? (stats.overdueTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderKanban className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No projects yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => {
                  const completedTasks = project.tasks?.filter(task => 
                    task.status === 'Completed' || task.status === 'Done'
                  ).length || 0;
                  const totalTasks = project.tasks?.length || 0;
                  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          ></div>
                          <span className="text-sm font-medium truncate">{project.projectName}</span>
                        </div>
                        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{completedTasks}/{totalTasks} tasks</span>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}