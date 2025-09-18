// Analytics and Dashboard Types

export interface TaskStatus {
  UPCOMING: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  COMPLETED: number;
  OVERDUE: number;
}

export interface ProjectStatus {
  PENDING: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  COMPLETED: number;
}

export interface UserProgress {
  userId: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  onTimeCompletionRate: number;
  taskStatus: TaskStatus;
}

export interface OrganizationKPIs {
  organizationId: string;
  organizationName: string;
  activeMembers: number;
  membersCompletedAllWork: number;
  totalTasksCompleted: number;
  taskStatus: TaskStatus;
  projectStatus: ProjectStatus;
  overdueTasks: number;
}

export interface CrossOrganizationStats {
  userId: string;
  userName: string;
  organizations: {
    organizationId: string;
    organizationName: string;
    completionPercentage: number;
    totalTasks: number;
    completedTasks: number;
  }[];
  overallCompletionPercentage: number;
  totalTasksAcrossOrgs: number;
  totalCompletedAcrossOrgs: number;
}

export interface WorkloadDistribution {
  userId: string;
  userName: string;
  tasksByStatus: TaskStatus;
  tasksByProject: {
    projectId: string;
    projectName: string;
    taskCount: number;
  }[];
  tasksByPriority: {
    priority: string;
    count: number;
  }[];
}

export interface ThroughputData {
  date: string;
  completedTasks: number;
  cumulativeCompleted: number;
}

export interface LeadCycleTime {
  projectId: string;
  projectName: string;
  averageLeadTime: number; // days
  averageCycleTime: number; // days
  medianLeadTime: number;
  medianCycleTime: number;
  p95LeadTime: number;
  p95CycleTime: number;
}

export interface CumulativeFlowData {
  date: string;
  upcoming: number;
  inProgress: number;
  inReview: number;
  completed: number;
}

export interface WorkloadHeatmap {
  userId: string;
  userName: string;
  priority: string;
  taskCount: number;
  isOverloaded: boolean;
}

export interface AgingWIP {
  taskId: string;
  taskName: string;
  daysInCurrentState: number;
  priority: string;
  assigneeName: string;
  currentStatus: string;
}

export interface OnTimeDelivery {
  projectId: string;
  projectName: string;
  onTimePercentage: number;
  totalTasks: number;
  onTimeTasks: number;
}

export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  organizationIds?: string[];
  projectIds?: string[];
  userIds?: string[];
  priority?: string[];
  excludeArchived?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface MetricCard {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: string;
  description?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'heatmap';
  data: any;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  config?: any;
}

// Chart Types
export type ChartType = 
  | 'pie' 
  | 'doughnut' 
  | 'bar' 
  | 'line' 
  | 'radar' 
  | 'scatter' 
  | 'heatmap'
  | 'gauge'
  | 'funnel'
  | 'sankey';

export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options?: any;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}

// Advanced Analytics Features
export interface PredictiveAnalytics {
  projectId: string;
  projectName: string;
  estimatedCompletionDate: string;
  confidenceLevel: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface CapacityPlanning {
  userId: string;
  userName: string;
  availableHours: number;
  assignedHours: number;
  utilizationPercentage: number;
  isOverloaded: boolean;
  recommendations: string[];
}

export interface GoalAlignment {
  projectId: string;
  projectName: string;
  quarterlyObjective: string;
  progressPercentage: number;
  targetDate: string;
  isOnTrack: boolean;
}

export interface CollaborationMetrics {
  userId: string;
  userName: string;
  tasksReviewed: number;
  tasksApproved: number;
  reviewContribution: number;
  collaborationScore: number;
}

export interface GamificationData {
  userId: string;
  userName: string;
  badges: {
    name: string;
    description: string;
    earnedAt: string;
    icon: string;
  }[];
  points: number;
  level: string;
  rank: number;
  achievements: string[];
}