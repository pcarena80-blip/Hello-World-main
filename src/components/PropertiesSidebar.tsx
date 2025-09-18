import React from 'react';
import { X, Calendar, User, Tag, Flag, Clock, Target, Users, AlertCircle, CheckCircle, Star, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

interface TaskPropertiesSidebarProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface ProjectPropertiesSidebarProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TaskPropertiesSidebar({ task, isOpen, onClose, onEdit, onDelete }: TaskPropertiesSidebarProps) {
  if (!isOpen || !task) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200',
      'urgent': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'upcoming': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'on-hold': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title and Status */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-900">{task.title || task.taskName || 'Untitled Task'}</h3>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(task.status)}>
                {task.status || 'Unknown'}
              </Badge>
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority || 'Unknown'}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Description
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {task.description}
              </p>
            </div>
          )}

          {/* Assignment */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4" />
              Assignment
            </h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {task.assignedTo?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {task.assignedTo?.name || 'Unassigned'}
                </p>
                <p className="text-xs text-gray-500">
                  {task.assignedTo?.email || 'No email'}
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(task.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(task.dueDate || task.deadline)}
                </p>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          {(task.estimatedHours || task.actualHours) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Tracking
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Estimated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {task.estimatedHours || 0}h
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Actual</p>
                  <p className="text-sm font-medium text-gray-900">
                    {task.actualHours || 0}h
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Created By */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Created By
            </h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {task.createdBy?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {task.createdBy?.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(task.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {task.progress !== undefined && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Progress
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completion</span>
                  <span className="font-medium text-gray-900">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectPropertiesSidebar({ project, isOpen, onClose, onEdit, onDelete }: ProjectPropertiesSidebarProps) {
  if (!isOpen || !project) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'planned': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'on-hold': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200',
      'urgent': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title and Status */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-900">
              {project.name || project.projectName || 'Untitled Project'}
            </h3>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>
                {project.status || 'Unknown'}
              </Badge>
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority || 'Unknown'}
              </Badge>
              {project.isStarred && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Description
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {project.description}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(project.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Deadline</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(project.deadline || project.dueDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Team */}
          {project.team && project.team.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team ({project.team.length})
              </h4>
              <div className="space-y-2">
                {project.team.map((member: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {member.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {member.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.role || 'Member'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget */}
          {project.budget && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Budget
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Allocated</p>
                  <p className="text-sm font-medium text-gray-900">
                    ${project.budget.allocated?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Used</p>
                  <p className="text-sm font-medium text-gray-900">
                    ${project.budget.used?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Created By */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Created By
            </h4>
            <div className="flex items-center gap-3">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {project.createdBy?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {project.createdBy?.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(project.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
