import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Award,
  Zap,
  Building2,
  UserCheck,
  UserX,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { ChartJsPieChart } from './charts/ChartJsPieChart';

// Helper function to read organizations data
const readOrganizations = async () => {
  try {
    const response = await fetch('/api/organizations.json');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error reading organizations:', error);
    return [];
  }
};

interface OrganizationDashboardProps {
  organizationId: string;
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export const AdvancedOrganizationDashboard: React.FC<OrganizationDashboardProps> = ({
  organizationId,
  userRole
}) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  console.log('🏢 AdvancedOrganizationDashboard: Received organizationId:', organizationId, 'userRole:', userRole);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadDashboardData();
  }, [organizationId, dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 AdvancedOrganizationDashboard: Loading data for organizationId:', organizationId);
      
      // Load real tasks, projects, and organizations data
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`/api/tasks?organizationId=${organizationId}`),
        fetch(`/api/organizations/${organizationId}/projects`)
      ]);
      
      const tasksData = tasksRes.ok ? await tasksRes.json() : [];
      const projectsData = projectsRes.ok ? await projectsRes.json() : [];
      
      // Get real organizations data from the organizations.json file
      const organizationsData = await readOrganizations();
      
      // Calculate real stats
      const completedTasks = tasksData.filter((t: any) => t.status?.toLowerCase().includes('complete')).length;
      const activeProjects = projectsData.filter((p: any) => p.status?.toLowerCase().includes('progress')).length;
      
      // Generate task completion trend data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      const taskCompletionTrend = last7Days.map(date => {
        const completed = tasksData.filter((t: any) => 
          t.completedAt && t.completedAt.startsWith(date)
        ).length;
        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          completed
        };
      });
      
      // Generate status distribution data
      const statusCounts = tasksData.reduce((acc: any, task: any) => {
        const status = task.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count as number,
        color: getStatusColor(status)
      }));

      // Process organizations data for bar chart using real member counts
      const organizationsChartData = organizationsData.map((org: any) => {
        const userCount = org.memberCount || 0;
        
        console.log(`📊 Organization ${org.name}: ${userCount} members`);
        
        return {
          name: org.name || `Org ${org.id}`,
          users: userCount,
          id: org.id
        };
      });
      
      const data = {
        stats: { 
          totalProjects: projectsData.length, 
          activeProjects, 
          completedTasks, 
          teamMembers: new Set(tasksData.map((t: any) => t.assignedTo).filter(Boolean)).size 
        },
        taskCompletionTrend,
        statusDistribution,
        organizationsData: organizationsChartData,
        orgKPIs: {},
        workloadDistribution: [],
        throughputData: [],
        cumulativeFlowData: []
      };
      
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete')) return '#10b981';
    if (statusLower.includes('progress')) return '#3b82f6';
    if (statusLower.includes('review')) return '#f59e0b';
    if (statusLower.includes('hold')) return '#6b7280';
    return '#8b5cf6';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const { orgKPIs, workloadDistribution, throughputData, cumulativeFlowData } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-blue-500" />
            Organization Dashboard
          </h1>
          <p className="text-muted-foreground">Comprehensive analytics and team performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgKPIs?.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{orgKPIs?.totalTasksCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">
              In the last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{orgKPIs?.overdueTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members Completed All Work</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{orgKPIs?.membersCompletedAllWork || 0}</div>
            <p className="text-xs text-muted-foreground">
              All tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-500" />
            Task Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {orgKPIs?.taskStatus?.UPCOMING || 0}
              </div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {orgKPIs?.taskStatus?.IN_PROGRESS || 0}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {orgKPIs?.taskStatus?.IN_REVIEW || 0}
              </div>
              <p className="text-sm text-muted-foreground">In Review</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {orgKPIs?.taskStatus?.COMPLETED || 0}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {orgKPIs?.taskStatus?.OVERDUE || 0}
              </div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
            Project Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {orgKPIs?.projectStatus?.PENDING || 0}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {orgKPIs?.projectStatus?.IN_PROGRESS || 0}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {orgKPIs?.projectStatus?.IN_REVIEW || 0}
              </div>
              <p className="text-sm text-muted-foreground">In Review</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {orgKPIs?.projectStatus?.COMPLETED || 0}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workload Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-500" />
            Team Workload Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workloadDistribution?.map((member: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {member.userName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.tasksByStatus?.IN_PROGRESS || 0} in progress, {member.tasksByStatus?.COMPLETED || 0} completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={member.isOverloaded ? "destructive" : "secondary"}>
                    {member.isOverloaded ? "Overloaded" : "Balanced"}
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {member.tasksByStatus?.IN_PROGRESS + member.tasksByStatus?.IN_REVIEW || 0} active
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Task Completion Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData?.taskCompletionTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Organizations & Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData?.organizationsData?.length > 0 ? dashboardData.organizationsData : [
                  { name: 'No Data', users: 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
              
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart.js Pie Chart */}
      <ChartJsPieChart 
        orgId={organizationId}
        className="w-full"
      />

      {/* Advanced Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Advanced Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <p className="text-sm text-muted-foreground">On-Time Delivery Rate</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">12.5</div>
              <p className="text-sm text-muted-foreground">Avg. Lead Time (days)</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">8.2</div>
              <p className="text-sm text-muted-foreground">Avg. Cycle Time (days)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

