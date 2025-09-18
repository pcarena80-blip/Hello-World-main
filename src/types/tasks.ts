export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string; // Required - every task must belong to a project
  organizationId: string; // Required - every task must belong to an organization
  milestoneId?: string; // Optional - tasks can be grouped under milestones
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  progress?: number; // 0-100
  comments?: TaskComment[];
  dependencies?: string[]; // Array of task IDs that this task depends on
  effortEstimate?: number; // Story points or hours estimate
  watchers?: string[]; // Array of user IDs who should be notified
  
  // Enhanced fields for analytics and tracking
  startedAt?: string; // When task was first moved to IN_PROGRESS
  inReviewAt?: string; // When task was moved to IN_REVIEW
  isOverdue?: boolean; // Computed field: dueDate < now AND status != COMPLETED
  leadTime?: number; // completedAt - createdAt (in days)
  cycleTime?: number; // completedAt - startedAt (in days)
  onTimeCompletion?: boolean; // completedAt <= dueDate
}

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface TaskPriority {
  id: string;
  name: string;
  color: string;
  level: number;
}

export interface TaskComment {
  id: string;
  content: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planned' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string; // Optional start date
  dueDate: string; // Required due date - tasks cannot exceed this
  completedDate?: string;
  color: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  team: Array<{
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
  }>;
  taskGenerationMode: 'manual' | 'template' | 'ai-assist';
  defaultValues: {
    priority: string;
    labels: string[];
    assignees: string[];
    watchers: string[];
  };
  tags: string[];
  budget?: {
    allocated: number;
    used: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
  isStarred: boolean;
  isArchived: boolean;
  // RBAC Permissions
  permissions?: {
    create: {
      level: 'none' | 'specific' | 'all';
      specificUsers?: string[];
    };
    read: {
      level: 'none' | 'specific' | 'all';
      specificUsers?: string[];
    };
    update: {
      level: 'none' | 'specific' | 'all';
      specificUsers?: string[];
    };
    delete: {
      level: 'none' | 'specific' | 'all';
      specificUsers?: string[];
    };
    assignToUser?: {
      level: 'none' | 'specific' | 'all';
      specificUsers?: string[];
    };
    manageMembers?: {
      level: 'none' | 'specific' | 'all';
      specificUsers?: string[];
    };
  };
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  date: string; // Must be within project's date range
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_due_soon' | 'project_changed' | 'dependency_unblocked' | 'milestone_reached' | 'project_completed';
  title: string;
  message: string;
  payload: {
    entityType: 'task' | 'project' | 'milestone';
    entityId: string;
    projectId?: string;
  };
  read: boolean;
  deliveryChannels: ('in-app' | 'email' | 'push')[];
  createdAt: string;
  scheduledFor?: string; // For scheduled notifications like "due soon"
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  phases: Array<{
    name: string;
    description: string;
    duration: number; // Days from project start
    tasks: Array<{
      title: string;
      description: string;
      estimatedHours: number;
      priority: string;
      dependencies?: string[]; // References to other task titles in this template
    }>;
  }>;
  defaultValues: {
    priority: string;
    labels: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskView {
  id: string;
  name: string;
  type: 'list' | 'board' | 'timeline' | 'calendar';
}

export interface TaskFilter {
  status?: string[];
  priority?: string[];
  assignee?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  createdBy?: string[];
}

export interface TaskSort {
  field: 'title' | 'dueDate' | 'priority' | 'status' | 'createdAt' | 'assignee';
  direction: 'asc' | 'desc';
}

// Predefined task statuses following the workflow: Upcoming → In Progress → In Review → Completed
export const TASK_STATUSES: TaskStatus[] = [
  {
    id: 'upcoming',
    name: 'Upcoming',
    color: '#6B7280',
    order: 1
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    color: '#3B82F6',
    order: 2
  },
  {
    id: 'in-review',
    name: 'In Review',
    color: '#F59E0B',
    order: 3
  },
  {
    id: 'completed',
    name: 'Completed',
    color: '#10B981',
    order: 4
  }
];

// Predefined task priorities
export const TASK_PRIORITIES: TaskPriority[] = [
  {
    id: 'low',
    name: 'Low',
    color: '#6B7280',
    level: 1
  },
  {
    id: 'medium',
    name: 'Medium',
    color: '#F59E0B',
    level: 2
  },
  {
    id: 'high',
    name: 'High',
    color: '#EF4444',
    level: 3
  },
  {
    id: 'urgent',
    name: 'Urgent',
    color: '#DC2626',
    level: 4
  }
];

// Available task views
export const TASK_VIEWS: TaskView[] = [
  {
    id: 'list',
    name: 'List',
    type: 'list'
  },
  {
    id: 'board',
    name: 'Board',
    type: 'board'
  },
  {
    id: 'timeline',
    name: 'Timeline',
    type: 'timeline'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    type: 'calendar'
  }
];

export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'completedDate' | 'comments'>;

export type ProjectFormData = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'completedDate'>;

export type MilestoneFormData = Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>;

export interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentView: TaskView;
  filters: TaskFilter;
  sort: TaskSort;
  customStatuses: TaskStatus[];
  
  // CRUD operations
  addTask: (task: TaskFormData) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // View and filter operations
  setCurrentView: (view: TaskView) => void;
  setFilters: (filters: TaskFilter) => void;
  setSort: (sort: TaskSort) => void;
  
  // Utility functions
  getTasksByStatus: (statusId: string) => Task[];
  getFilteredTasks: () => Task[];
  getMyTasks: () => Task[];
  getAllUsers: () => User[];
  moveTask: (taskId: string, newStatus: string, newOrder?: number) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  
  // Custom status management
  addCustomStatus: (status: Omit<TaskStatus, 'id'>) => void;
  updateCustomStatus: (id: string, updates: Partial<TaskStatus>) => void;
  deleteCustomStatus: (id: string) => void;
  loadCustomStatuses: () => void;
  
  // Data loading
  loadTasks: () => Promise<void>;
}

// Re-export User type from AuthContext to avoid duplication
export type { User } from '../contexts/AuthContext';