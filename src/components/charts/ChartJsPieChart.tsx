import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartJsPieChartProps {
  orgId: string;
  className?: string;
}

declare global {
  interface Window {
    Chart: any;
  }
}

export function ChartJsPieChart({ orgId, className = "" }: ChartJsPieChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);

  console.log('🎯 ChartJsPieChart: Received orgId:', orgId);
  
  // Test if component is rendering
  console.log('🎯 ChartJsPieChart: Component is rendering!');

  // Load Chart.js
  useEffect(() => {
    const loadChartJs = async () => {
      if (window.Chart) {
        console.log('✅ ChartJsPieChart: Chart.js already loaded');
        loadData();
        return;
      }
      
      console.log('📦 ChartJsPieChart: Loading Chart.js...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        console.log('✅ ChartJsPieChart: Chart.js loaded successfully');
        // Wait a bit for Chart to be available globally
        setTimeout(() => {
          loadData();
        }, 100);
      };
      
      script.onerror = () => {
        console.error('❌ ChartJsPieChart: Failed to load Chart.js');
        setLoading(false);
      };
    };
    
    loadChartJs();
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  // Load data when orgId changes
  useEffect(() => {
    console.log('🔄 ChartJsPieChart: useEffect triggered - orgId:', orgId, 'Chart available:', !!window.Chart);
    if (window.Chart && orgId) {
      loadData();
    }
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 ChartJsPieChart: Loading projects for orgId:', orgId);
      
      if (!orgId) {
        console.log('❌ ChartJsPieChart: No orgId provided');
        setProjects([]);
        return;
      }
      
      const url = `/api/organizations/${orgId}/projects`;
      console.log('📡 ChartJsPieChart: Fetching from:', url);
      
      const response = await fetch(url);
      const projectsData = response.ok ? await response.json() : [];
      
      console.log('📊 ChartJsPieChart: Received projects:', projectsData.length, 'projects');
      console.log('📊 ChartJsPieChart: Sample project:', projectsData[0]);
      
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createChart = () => {
    console.log('🎨 ChartJsPieChart: Creating chart...');
    console.log('🎨 ChartJsPieChart: chartRef.current:', chartRef.current);
    console.log('🎨 ChartJsPieChart: window.Chart:', window.Chart);
    console.log('🎨 ChartJsPieChart: projects.length:', projects.length);
    
    if (!chartRef.current || !window.Chart) {
      console.log('❌ ChartJsPieChart: Missing requirements for chart creation');
      return;
    }

    // Destroy existing chart
    if (chartInstance.current) {
      console.log('🗑️ ChartJsPieChart: Destroying existing chart');
      chartInstance.current.destroy();
    }

    // Calculate project status distribution
    const statusCounts = projects.reduce((acc: any, project: any) => {
      const status = project.status || project.projectStatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 ChartJsPieChart: Project status counts:', statusCounts);

    // If no projects, create a simple test chart
    if (projects.length === 0) {
      console.log('📊 ChartJsPieChart: No projects, creating test chart');
      const testData = {
        labels: ['Completed', 'In Progress', 'On Hold', 'Upcoming'],
        datasets: [{
          data: [1, 2, 1, 1],
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      };
      
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new window.Chart(ctx, {
          type: 'pie',
          data: testData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  padding: 20,
                  usePointStyle: true
                }
              }
            }
          }
        });
        console.log('✅ ChartJsPieChart: Test chart created successfully');
      }
      return;
    }

    // Map to Chart.js format with colors - prioritize the specific statuses you mentioned
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts) as number[];
    const colors = labels.map(status => {
      const statusLower = status.toLowerCase();
      if (statusLower.includes('complete') || statusLower.includes('completed')) return '#22c55e'; // Green - Completed
      if (statusLower.includes('review') || statusLower.includes('in-review')) return '#eab308'; // Yellow - Review
      if (statusLower.includes('hold') || statusLower.includes('on-hold')) return '#ef4444'; // Red - On Hold
      if (statusLower.includes('upcoming') || statusLower.includes('planned')) return '#3b82f6'; // Blue - Upcoming
      if (statusLower.includes('progress') || statusLower.includes('in-progress')) return '#f59e0b'; // Orange - In Progress
      return '#6b7280'; // Gray for unknown
    });

    console.log('🎨 ChartJsPieChart: Chart data:', { labels, data, colors });

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) {
      console.error('❌ ChartJsPieChart: Could not get 2D context');
      return;
    }

    try {
      chartInstance.current = new window.Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                }
              }
            }
          },
          animation: {
            animateRotate: true,
            duration: 1000
          }
        }
      });
      console.log('✅ ChartJsPieChart: Chart created successfully');
    } catch (error) {
      console.error('❌ ChartJsPieChart: Error creating chart:', error);
    }
  };

  useEffect(() => {
    console.log('🔄 ChartJsPieChart: useEffect triggered - loading:', loading, 'projects:', projects.length, 'Chart available:', !!window.Chart);
    if (!loading && window.Chart) {
      // Add a small delay to ensure the canvas is ready
      setTimeout(() => {
        createChart();
      }, 50);
    }
  }, [loading, projects]);

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading project data...</span>
            <div className="text-xs text-gray-500 mt-2">OrgId: {orgId || 'undefined'}</div>
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
            <PieChart className="h-5 w-5" />
            Projects
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <canvas ref={chartRef} />
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-800">Chart.js Pie Chart - Debug Info:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <p className="text-xs text-blue-600">OrgId: {orgId || 'undefined'}</p>
            <p className="text-xs text-blue-600">Projects: {projects.length}</p>
            <p className="text-xs text-blue-600">Loading: {loading ? 'true' : 'false'}</p>
            <p className="text-xs text-blue-600">Chart Available: {window.Chart ? 'true' : 'false'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
