import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { AnalyticsService } from '@/services/analyticsService';
import { OrganizationDashboardMetrics, ChartData } from '@/types/analytics';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  Target,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Building2,
  Filter,
  Download,
  UserCheck,
  UserX,
  AlertTriangle,
  Zap,
  Award,
  TrendingDown
} from 'lucide-react';

interface OrganizationDashboardProps {
  organizationId?: string;
  className?: string;
}

export function OrganizationDashboard({ organizationId, className }: OrganizationDashboardProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [orgMetrics, setOrgMetrics] = useState<OrganizationDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'performance' | 'workload'>('overview');

  const targetOrgId = organizationId || currentOrganization?.id;

  useEffect(() => {
    if (targetOrgId) {
      loadOrganizationMetrics();
    }
  }, [targetOrgId, dateRange]);

  const loadOrganizationMetrics = async () => {
    if (!targetOrgId) return;
    
    setLoading(true);
    try {
      const metrics = await AnalyticsService.getOrganizationDashboardMetrics(
        targetOrgId,
        { dateRange: { start: getDateRangeStart(), end: new Date().toISOString() } }
      );
      setOrgMetrics(metrics);
    } catch (error) {
      console.error('Failed to load organization metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const getPerformanceIcon = (value: number, threshold: number) => {
    if (value > threshold) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (value < threshold * 0.8) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-yellow-600" />;
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value > threshold) return 'text-green-600';
    if (value < threshold * 0.8) return 'text-red-600';
    return 'text-yellow-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Dashboard</h1>
          <p className="text-gray-600">Monitor team performance and project health</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedView === 'overview' ? 'default' : 'outline'}
          onClick={() => setSelectedView('overview')}
        >
          Overview
        </Button>
        <Button
          variant={selectedView === 'performance' ? 'default' : 'outline'}
          onClick={() => setSelectedView('performance')}
        >
          Performance
        </Button>
        <Button
          variant={selectedView === 'workload' ? 'default' : 'outline'}
          onClick={() => setSelectedView('workload')}
        >
          Workload
        </Button>
      </div>

      {orgMetrics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold">{orgMetrics.memberActivity.totalMembers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Members</p>
                    <p className="text-2xl font-bold text-green-600">{orgMetrics.memberActivity.activeMembers}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed All Work</p>
                    <p className="text-2xl font-bold text-blue-600">{orgMetrics.memberActivity.completedAllWork}</p>
                  </div>
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                    <p className="text-2xl font-bold text-red-600">{orgMetrics.taskAnalytics.overdue}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Task Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm">Upcoming</span>
                    </div>
                    <span className="font-bold">{orgMetrics.taskAnalytics.upcoming}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <span className="font-bold">{orgMetrics.taskAnalytics.inProgress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">In Review</span>
                    </div>
                    <span className="font-bold">{orgMetrics.taskAnalytics.inReview}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <span className="font-bold">{orgMetrics.taskAnalytics.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Overdue</span>
                    </div>
                    <span className="font-bold text-red-600">{orgMetrics.taskAnalytics.overdue}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Project Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="font-bold">{orgMetrics.projectAnalytics.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <span className="font-bold">{orgMetrics.projectAnalytics.inProgress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <span className="font-bold">{orgMetrics.projectAnalytics.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Overdue</span>
                    </div>
                    <span className="font-bold text-red-600">{orgMetrics.projectAnalytics.overdue}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects */}
          {selectedView === 'performance' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {getPerformanceIcon(orgMetrics.performance.averageCompletionRate, 70)}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {orgMetrics.performance.averageCompletionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {getPerformanceIcon(orgMetrics.performance.averageOnTimeRate, 80)}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {orgMetrics.performance.averageOnTimeRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">On-Time Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {orgMetrics.performance.averageLeadTime.toFixed(1)}d
                    </p>
                    <p className="text-sm text-gray-600">Avg Lead Time</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {orgMetrics.performance.totalThroughput.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Tasks/Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workload Balance */}
          {selectedView === 'workload' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Overloaded Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orgMetrics.workloadBalance.overloadedMembers.length > 0 ? (
                    <div className="space-y-3">
                      {orgMetrics.workloadBalance.overloadedMembers.map((member, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium">{member.userName}</p>
                            <p className="text-sm text-gray-600">
                              {member.taskCount} tasks (max: {member.maxRecommended})
                            </p>
                          </div>
                          <Badge variant="destructive">Overloaded</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-gray-600">No overloaded members</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-yellow-600" />
                    Underutilized Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orgMetrics.workloadBalance.underutilizedMembers.length > 0 ? (
                    <div className="space-y-3">
                      {orgMetrics.workloadBalance.underutilizedMembers.map((member, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium">{member.userName}</p>
                            <p className="text-sm text-gray-600">{member.taskCount} tasks</p>
                          </div>
                          <Badge variant="outline" className="text-yellow-600">Available</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-gray-600">All members are well utilized</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Member Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {orgMetrics.memberActivity.activeMembers}
                  </p>
                  <p className="text-sm text-gray-600">Active Members</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {orgMetrics.memberActivity.completedAllWork}
                  </p>
                  <p className="text-sm text-gray-600">Completed All Work</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserX className="h-8 w-8 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-600">
                    {orgMetrics.memberActivity.inactiveMembers}
                  </p>
                  <p className="text-sm text-gray-600">Inactive Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Data State */}
      {!orgMetrics && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">
              No tasks or projects found in the selected organization and time period.
            </p>
            <Button>
              Create First Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
