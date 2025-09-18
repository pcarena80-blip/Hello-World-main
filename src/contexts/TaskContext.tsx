import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { Task, TaskFormData, TaskContextType, TaskView, TaskFilter, TaskSort, TASK_VIEWS, TASK_STATUSES, TaskStatus, User } from '../types/tasks';
import { useAuth } from './AuthContext';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentView: TaskView;
  filters: TaskFilter;
  sort: TaskSort;
  customStatuses: TaskStatus[];
}

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_VIEW'; payload: TaskView }
  | { type: 'SET_FILTERS'; payload: TaskFilter }
  | { type: 'SET_SORT'; payload: TaskSort }
  | { type: 'MOVE_TASK'; payload: { taskId: string; newStatus: string; newOrder?: number } }
  | { type: 'SET_CUSTOM_STATUSES'; payload: TaskStatus[] }
  | { type: 'ADD_CUSTOM_STATUS'; payload: TaskStatus }
  | { type: 'UPDATE_CUSTOM_STATUS'; payload: { id: string; updates: Partial<TaskStatus> } }
  | { type: 'DELETE_CUSTOM_STATUS'; payload: string };

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  currentView: TASK_VIEWS[0], // Default to List view
  filters: {},
  sort: { field: 'dueDate', direction: 'asc' },
  customStatuses: [...TASK_STATUSES] // Initialize with default statuses
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false, error: null };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : task
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.taskId) {
            const updates: Partial<Task> = {
              status: state.customStatuses.find(s => s.id === action.payload.newStatus) || task.status,
              updatedAt: new Date().toISOString()
            };
            
            // If moving to completed, set completed date
            if (action.payload.newStatus === 'completed' && task.status.id !== 'completed') {
              updates.completedDate = new Date().toISOString();
              updates.progress = 100;
            }
            
            return { ...task, ...updates };
          }
          return task;
        })
      };
    case 'SET_CUSTOM_STATUSES':
      return { ...state, customStatuses: action.payload };
    case 'ADD_CUSTOM_STATUS':
      return { ...state, customStatuses: [...state.customStatuses, action.payload] };
    case 'UPDATE_CUSTOM_STATUS':
      return {
        ...state,
        customStatuses: state.customStatuses.map(status =>
          status.id === action.payload.id
            ? { ...status, ...action.payload.updates }
            : status
        )
      };
    case 'DELETE_CUSTOM_STATUS':
      return {
        ...state,
        customStatuses: state.customStatuses.filter(status => status.id !== action.payload)
      };
    default:
      return state;
  }
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { user } = useAuth();

  // Load tasks and custom statuses from shared localStorage on mount and when user changes
  useEffect(() => {
    if (user) {
      loadTasks();
      loadCustomStatuses();
    }
  }, [user]);

  // Set up periodic refresh for tasks (only when user is authenticated)
  useEffect(() => {
    if (!user) return;
    
    // Refresh tasks every 30 seconds to catch tasks created by other users
    const interval = setInterval(() => {
      loadTasks();
      loadCustomStatuses();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const loadTasks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load from backend API
      const response = await fetch('http://localhost:3001/api/tasks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
      
      console.log('🔄 TaskContext: Loading tasks from backend API');
      console.log('📊 TaskContext: Found', tasks.length, 'tasks from API');
      console.log('📋 TaskContext: Tasks:', tasks);
      
      dispatch({ type: 'SET_TASKS', payload: tasks });
    } catch (error) {
      console.error('❌ TaskContext: Failed to load tasks:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
      
      // Fallback to localStorage if API fails
      try {
        const savedTasks = localStorage.getItem('shared_tasks');
        const fallbackTasks = savedTasks ? JSON.parse(savedTasks) : [];
        console.log('🔄 TaskContext: Using localStorage fallback with', fallbackTasks.length, 'tasks');
        dispatch({ type: 'SET_TASKS', payload: fallbackTasks });
      } catch (fallbackError) {
        console.error('❌ TaskContext: Fallback also failed:', fallbackError);
      }
    }
  };

  const saveTasks = async (tasks: Task[]) => {
    // Save to backend API
    try {
      // For now, we'll save each task individually to the API
      // In a real app, you might want to implement batch operations
      console.log('💾 TaskContext: Saving tasks to backend API');
    } catch (error) {
      console.error('❌ TaskContext: Failed to save tasks to API:', error);
      // Fallback to localStorage
      localStorage.setItem('shared_tasks', JSON.stringify(tasks));
    }
  };

  const loadCustomStatuses = async () => {
    try {
      // Load from backend API
      const response = await fetch('http://localhost:3001/api/custom-statuses');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const statuses = await response.json();
      
      console.log('🔍 TaskContext: Loading custom statuses from backend API');
      console.log('🔍 TaskContext: Retrieved custom statuses:', statuses);
      console.log('📋 TaskContext: Number of statuses loaded:', statuses.length);
      
      dispatch({ type: 'SET_CUSTOM_STATUSES', payload: statuses });
    } catch (error) {
      console.error('❌ TaskContext: Failed to load custom statuses from API:', error);
      
      // Fallback to localStorage
      try {
        const savedStatuses = localStorage.getItem('custom_task_statuses');
        if (savedStatuses) {
          const fallbackStatuses = JSON.parse(savedStatuses);
          console.log('🔄 TaskContext: Using localStorage fallback for custom statuses');
          dispatch({ type: 'SET_CUSTOM_STATUSES', payload: fallbackStatuses });
        } else {
          // If no custom statuses are saved, initialize with default statuses
          console.log('🔍 TaskContext: No saved statuses, initializing with defaults:', TASK_STATUSES);
          dispatch({ type: 'SET_CUSTOM_STATUSES', payload: TASK_STATUSES });
          saveCustomStatuses(TASK_STATUSES);
        }
      } catch (fallbackError) {
        console.error('❌ TaskContext: Fallback for custom statuses also failed:', fallbackError);
        // Final fallback to default statuses
        console.log('🔍 TaskContext: Error fallback, using defaults:', TASK_STATUSES);
        dispatch({ type: 'SET_CUSTOM_STATUSES', payload: TASK_STATUSES });
        saveCustomStatuses(TASK_STATUSES);
      }
    }
  };

  const saveCustomStatuses = (statuses: TaskStatus[]) => {
    localStorage.setItem('custom_task_statuses', JSON.stringify(statuses));
  };

  const addTask = async (taskData: TaskFormData) => {
    try {
      const newTaskData = {
        ...taskData,
        createdBy: {
          id: user?.id || 0,
          name: user?.name || '',
          email: user?.email || ''
        },
        status: state.customStatuses.find(s => s.id === taskData.status.id) || state.customStatuses[0],
        progress: taskData.progress || 0
      };
      
      console.log('➕ TaskContext: Creating new task via API:', newTaskData);
      console.log('👤 TaskContext: Created by user:', user);
      
      // Create task via API
      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTaskData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newTask = await response.json();
      console.log('✅ TaskContext: Task created successfully:', newTask);
      
      dispatch({ type: 'ADD_TASK', payload: newTask });
      
      // Also save to localStorage as backup
      const updatedTasks = [...state.tasks, newTask];
      localStorage.setItem('shared_tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('❌ TaskContext: Failed to add task via API:', error);
      
      // Fallback to localStorage
      try {
        const newTask: Task = {
          ...taskData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: {
            id: user?.id || 0,
            name: user?.name || '',
            email: user?.email || ''
          },
          status: state.customStatuses.find(s => s.id === taskData.status.id) || state.customStatuses[0],
          progress: taskData.progress || 0
        };
        
        console.log('🔄 TaskContext: Using localStorage fallback for task creation');
        dispatch({ type: 'ADD_TASK', payload: newTask });
        
        const updatedTasks = [...state.tasks, newTask];
        localStorage.setItem('shared_tasks', JSON.stringify(updatedTasks));
      } catch (fallbackError) {
        console.error('❌ TaskContext: Fallback also failed:', fallbackError);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add task' });
      }
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      console.log('🔄 TaskContext: Updating task via API:', id, updates);
      
      // Update task via API
      const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedTask = await response.json();
      console.log('✅ TaskContext: Task updated successfully:', updatedTask);
      
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates: updatedTask } });
      
      // Also save to localStorage as backup
      const updatedTasks = state.tasks.map(task =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      );
      localStorage.setItem('shared_tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('❌ TaskContext: Failed to update task via API:', error);
      
      // Fallback to localStorage
      try {
        console.log('🔄 TaskContext: Using localStorage fallback for task update');
        dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
        
        const updatedTasks = state.tasks.map(task =>
          task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
        );
        localStorage.setItem('shared_tasks', JSON.stringify(updatedTasks));
      } catch (fallbackError) {
        console.error('❌ TaskContext: Fallback also failed:', fallbackError);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
      }
    }
  };

  const deleteTask = async (id: string) => {
    try {
      console.log('🗑️ TaskContext: Deleting task via API:', id);
      
      // Delete task via API
      const response = await fetch(`http://localhost:3001/api/tasks/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ TaskContext: Task deleted successfully');
      dispatch({ type: 'DELETE_TASK', payload: id });
      
      // Also update localStorage as backup
      const updatedTasks = state.tasks.filter(task => task.id !== id);
      localStorage.setItem('shared_tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('❌ TaskContext: Failed to delete task via API:', error);
      
      // Fallback to localStorage
      try {
        console.log('🔄 TaskContext: Using localStorage fallback for task deletion');
        dispatch({ type: 'DELETE_TASK', payload: id });
        
        const updatedTasks = state.tasks.filter(task => task.id !== id);
        localStorage.setItem('shared_tasks', JSON.stringify(updatedTasks));
      } catch (fallbackError) {
        console.error('❌ TaskContext: Fallback also failed:', fallbackError);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
      }
    }
  };

  const setCurrentView = (view: TaskView) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const setFilters = (filters: TaskFilter) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setSort = (sort: TaskSort) => {
    dispatch({ type: 'SET_SORT', payload: sort });
  };

  const getTasksByStatus = (statusId: string): Task[] => {
    return state.tasks.filter(task => task.status.id === statusId);
  };

  const getFilteredTasks = (): Task[] => {
    let filteredTasks = [...state.tasks];

    // Apply status filter
    if (state.filters.status && state.filters.status.length > 0) {
      filteredTasks = filteredTasks.filter(task =>
        state.filters.status!.includes(task.status.id)
      );
    }

    // Apply priority filter
    if (state.filters.priority && state.filters.priority.length > 0) {
      filteredTasks = filteredTasks.filter(task =>
        state.filters.priority!.includes(task.priority.id)
      );
    }

    // Apply assignee filter
    if (state.filters.assignee && state.filters.assignee.length > 0) {
      filteredTasks = filteredTasks.filter(task =>
        task.assignedTo && state.filters.assignee!.includes(task.assignedTo.email)
      );
    }

    // Apply date range filter
    if (state.filters.dateRange) {
      const { start, end } = state.filters.dateRange;
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= new Date(start) && dueDate <= new Date(end);
      });
    }

    // Apply tags filter
    if (state.filters.tags && state.filters.tags.length > 0) {
      filteredTasks = filteredTasks.filter(task =>
        task.tags && task.tags.some(tag => state.filters.tags!.includes(tag))
      );
    }

    // Apply sorting
    filteredTasks.sort((a, b) => {
      const { field, direction } = state.sort;
      let aValue: string | number | Date | undefined, bValue: string | number | Date | undefined;

      switch (field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'priority':
          aValue = a.priority.level;
          bValue = b.priority.level;
          break;
        case 'status':
          aValue = a.status.order;
          bValue = b.status.order;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'assignee':
          aValue = a.assignedTo?.name.toLowerCase() || '';
          bValue = b.assignedTo?.name.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredTasks;
  };

  const moveTask = async (taskId: string, newStatus: string, newOrder?: number) => {
    try {
      dispatch({ type: 'MOVE_TASK', payload: { taskId, newStatus, newOrder } });
      
      // Save to localStorage
      const updatedTasks = state.tasks.map(task => {
        if (task.id === taskId) {
          const updates: Partial<Task> = {
            status: state.customStatuses.find(s => s.id === newStatus) || task.status,
            updatedAt: new Date().toISOString()
          };
          
          if (newStatus === 'completed' && task.status.id !== 'completed') {
            updates.completedDate = new Date().toISOString();
            updates.progress = 100;
          }
          
          return { ...task, ...updates };
        }
        return task;
      });
      saveTasks(updatedTasks);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to move task' });
    }
  };

  const getMyTasks = (): Task[] => {
    if (!user) return [];
    
    // Show ALL tasks to ALL users (admin and regular users)
    // Users can see all tasks but know which ones are assigned to them
    return state.tasks;
  };

  // State for users list
  const [usersList, setUsersList] = useState<User[]>([]);

  // Fetch users from server
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/users?t=${Date.now()}`);
        if (response.ok) {
          const users = await response.json();
          setUsersList(users);
        } else {
          console.error('Failed to fetch users, status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    
    fetchUsers();
    
    // Refresh users list every 5 minutes to catch new registrations (reduced frequency)
    const interval = setInterval(fetchUsers, 300000);
    return () => clearInterval(interval);
  }, []);

  const getAllUsers = (): User[] => {
    // Filter to show only users (not admin) for task assignment
    return usersList.filter(u => u.role === 'user');
  };

  const addComment = async (taskId: string, content: string) => {
    try {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task || !user) return;

      const newComment = {
        id: Date.now().toString(),
        content,
        createdBy: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        createdAt: new Date().toISOString()
      };

      const updatedComments = [...(task.comments || []), newComment];
      
      await updateTask(taskId, { comments: updatedComments });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add comment' });
    }
  };

  // Custom Status Management Functions
  const addCustomStatus = async (status: Omit<TaskStatus, 'id'>) => {
    try {
      // Clear any previous errors
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Validate status name
      if (!status.name || status.name.trim().length === 0) {
        throw new Error('Status name is required');
      }
      
      // Check for duplicate names (case-insensitive)
      const isDuplicate = state.customStatuses.some(s => 
        s.name.toLowerCase() === status.name.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        throw new Error('A status with this name already exists');
      }
      
      const newStatusData = {
        ...status,
        order: state.customStatuses.length,
        name: status.name.trim()
      };
      
      console.log('➕ TaskContext: Adding new custom status via API:', newStatusData);
      
      // Create custom status via API
      const response = await fetch('http://localhost:3001/api/custom-statuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStatusData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newStatus = await response.json();
      console.log('✅ TaskContext: Custom status created successfully:', newStatus);
      
      dispatch({ type: 'ADD_CUSTOM_STATUS', payload: newStatus });
      
      // Also save to localStorage as backup
      const currentStatuses = JSON.parse(localStorage.getItem('custom_task_statuses') || '[]');
      const updatedStatuses = [...currentStatuses, newStatus];
      localStorage.setItem('custom_task_statuses', JSON.stringify(updatedStatuses));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add custom status';
      console.error('❌ TaskContext: Error adding custom status via API:', errorMessage);
      
      // Fallback to localStorage
      try {
        const newStatus: TaskStatus = {
          ...status,
          id: `custom-${Date.now()}`,
          order: state.customStatuses.length,
          name: status.name.trim()
        };
        
        console.log('🔄 TaskContext: Using localStorage fallback for custom status creation');
        dispatch({ type: 'ADD_CUSTOM_STATUS', payload: newStatus });
        
        const currentStatuses = JSON.parse(localStorage.getItem('custom_task_statuses') || '[]');
        const updatedStatuses = [...currentStatuses, newStatus];
        localStorage.setItem('custom_task_statuses', JSON.stringify(updatedStatuses));
      } catch (fallbackError) {
        console.error('❌ TaskContext: Fallback also failed:', fallbackError);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    }
  };

  const updateCustomStatus = (id: string, updates: Partial<TaskStatus>) => {
    try {
      // Clear any previous errors
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Find the status to update
      const existingStatus = state.customStatuses.find(s => s.id === id);
      if (!existingStatus) {
        throw new Error('Status not found');
      }
      
      // Validate name if it's being updated
      if (updates.name !== undefined) {
        if (!updates.name || updates.name.trim().length === 0) {
          throw new Error('Status name is required');
        }
        
        // Check for duplicate names (case-insensitive), excluding current status
        const isDuplicate = state.customStatuses.some(s => 
          s.id !== id && s.name.toLowerCase() === updates.name!.trim().toLowerCase()
        );
        
        if (isDuplicate) {
          throw new Error('A status with this name already exists');
        }
        
        updates.name = updates.name.trim();
      }
      
      dispatch({ type: 'UPDATE_CUSTOM_STATUS', payload: { id, updates } });
      const updatedStatuses = state.customStatuses.map(status =>
        status.id === id ? { ...status, ...updates } : status
      );
      saveCustomStatuses(updatedStatuses);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update custom status';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const deleteCustomStatus = (id: string) => {
    try {
      // Clear any previous errors
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Don't allow deleting default statuses
      const defaultStatusIds = TASK_STATUSES.map(s => s.id);
      if (defaultStatusIds.includes(id)) {
        throw new Error('Cannot delete default status');
      }
      
      // Find the status to delete
      const statusToDelete = state.customStatuses.find(s => s.id === id);
      if (!statusToDelete) {
        throw new Error('Status not found');
      }
      
      // Check if any tasks are using this status
      const tasksUsingStatus = state.tasks.filter(task => task.status.id === id);
      if (tasksUsingStatus.length > 0) {
        throw new Error(`Cannot delete status "${statusToDelete.name}" because it is being used by ${tasksUsingStatus.length} task(s)`);
      }
      
      dispatch({ type: 'DELETE_CUSTOM_STATUS', payload: id });
      const updatedStatuses = state.customStatuses.filter(status => status.id !== id);
      saveCustomStatuses(updatedStatuses);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete custom status';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const value: TaskContextType = {
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    currentView: state.currentView,
    filters: state.filters,
    sort: state.sort,
    customStatuses: state.customStatuses,
    addTask,
    updateTask,
    deleteTask,
    setCurrentView,
    setFilters,
    setSort,
    getTasksByStatus,
    getFilteredTasks,
    getMyTasks,
    getAllUsers,
    moveTask,
    addComment,
    addCustomStatus,
    updateCustomStatus,
    deleteCustomStatus,
    loadCustomStatuses,
    loadTasks
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}