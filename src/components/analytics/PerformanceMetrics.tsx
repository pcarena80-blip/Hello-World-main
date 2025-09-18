import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, RefreshCw, TrendingUp } from 'lucide-react';
import { getSocket } from '@/lib/socket';

interface PerformanceMetricsProps {
  orgId?: string;
  projectId?: string;
  className?: string;
}

// No special server shape needed; we will compute from projects

export function PerformanceMetrics({ orgId, className = "" }: PerformanceMetricsProps) {
  const [unit, setUnit] = useState<'hours' | 'tasks'>('tasks');
  // Initialize socket connection
  useEffect(() => {
    const socket = getSocket();
    
    return () => {
      // Don't disconnect here as it's a shared socket
    };
  }, []);

  // Load organization projects for chart
  const { data: projects, refetch } = useQuery({
    queryKey: ['org-projects', orgId],
    queryFn: async (): Promise<any[]> => {
      if (!orgId) return [];
      const res = await fetch(`/api/organizations/${orgId}/projects`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!orgId
  });

  // Listen for real-time updates
  useEffect(() => {
    if (!orgId) return;

    const socket = getSocket();

    const handleVelocityUpdate = (data: { orgId: string; projectId?: string }) => {
      if (data.orgId === orgId) refetch();
    };

    socket.on('analytics:velocity:updated', handleVelocityUpdate);
    
    return () => {
      socket.off('analytics:velocity:updated', handleVelocityUpdate);
    };
  }, [orgId, refetch]);

  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    const items = Array.isArray(projects) ? projects : [];
    // Aggregate per-status counts across projects
    let completed = 0, inReview = 0, onHold = 0, upcoming = 0;
    items.forEach((p: any) => {
      const tasks: any[] = Array.isArray(p.tasks) ? p.tasks : [];
      tasks.forEach(t => {
        const s = String(t.status || '').toLowerCase();
        if (s.includes('complete') || s === 'done') completed += 1;
        else if (s.includes('review')) inReview += 1;
        else if (s.includes('hold')) onHold += 1;
        else upcoming += 1;
      });
    });

    return [
      { label: 'Completed', value: completed },
      { label: 'In Review', value: inReview },
      { label: 'On Hold', value: onHold },
      { label: 'Upcoming', value: upcoming },
    ];
  }, [projects]);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading projects data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Unit selector */}
            
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number) => [
                  `${value} ${unit}`,
                  unit === 'hours' ? 'Estimated Hours' : 'Tasks'
                ]}
              />
              <Bar 
                dataKey="value" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No velocity data available</p>
              <p className="text-sm">Complete some tasks to see performance metrics</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
