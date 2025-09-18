import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Clock, 
  Target,
  Users,
  Calendar,
  Zap,
  Award,
  AlertTriangle
} from 'lucide-react';

// Mock chart components - in a real implementation, you'd use a charting library like Chart.js, Recharts, or D3
interface ChartProps {
  data: any;
  title: string;
  description?: string;
  className?: string;
}

export function CumulativeFlowChart({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Cumulative Flow Diagram</p>
            <p className="text-sm text-gray-500">Shows work in progress over time</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BurnupChart({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Burnup Chart</p>
            <p className="text-sm text-gray-500">Shows progress toward completion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeadTimeChart({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Lead Time Analysis</p>
            <p className="text-sm text-gray-500">Shows time from creation to completion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CycleTimeChart({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Cycle Time Analysis</p>
            <p className="text-sm text-gray-500">Shows time from start to completion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkloadHeatmap({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Workload Heatmap</p>
            <p className="text-sm text-gray-500">Shows workload distribution by member and priority</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OnTimeDeliveryChart({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">On-Time Delivery</p>
            <p className="text-sm text-gray-500">Shows percentage of tasks completed on time</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgingWIPChart({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Aging Work in Progress</p>
            <p className="text-sm text-gray-500">Shows how long tasks have been in current state</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ThroughputChart({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Throughput Analysis</p>
            <p className="text-sm text-gray-500">Shows tasks completed per time period</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PerformanceScorecard({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Performance Scorecard</p>
            <p className="text-sm text-gray-500">Shows key performance indicators</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BottleneckAnalysis({ data, title, description, className }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Bottleneck Analysis</p>
            <p className="text-sm text-gray-500">Identifies workflow bottlenecks and constraints</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
