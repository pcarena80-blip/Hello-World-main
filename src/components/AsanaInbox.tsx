import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Bell,
  CheckCircle,
  MessageSquare,
  Calendar,
  Clock,
  User,
  FolderKanban,
  Filter,
  Search,
  Plus,
  Target,
  CheckSquare,
  Edit,
  Trash2,
  Share,
  AlertCircle,
  CheckSquare2,
  XCircle,
  Play,
  Pause,
  Users,
  FileText,
  Activity
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string; // Changed to accept any type
  title: string;
  description: string;
  user: {
    id: string | { id: string; name: string; email: string };
    name: string | { id: string; name: string; email: string };
    role?: string;
    avatar?: string;
  };
  timestamp: string;
  project?: {
    id: string;
    name: string;
    color: string;
  };
  task?: {
    id: string;
    name: string;
  };
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  status?: string;
  metadata?: any;
}

export function AsanaInbox() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  useEffect(() => {
    console.log('AsanaInbox useEffect triggered, user:', user, 'organization:', currentOrganization?.name);
    loadActivities();
  }, [user, currentOrganization]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      console.log('Loading inbox messages...');
      console.log('User object:', user);
      console.log('Current organization:', currentOrganization?.name, 'ID:', currentOrganization?.id);
      
      // Wait for organization to be loaded
      if (!currentOrganization) {
        console.log('🔍 AsanaInbox: No organization selected, skipping load');
        setActivities([]);
        return;
      }
      
      console.log('🔍 AsanaInbox: Organization is loaded:', currentOrganization.name, 'ID:', currentOrganization.id);
      
      // Load activities from simple inbox endpoint with organization filter
      const url = `/api/inbox?organizationId=${currentOrganization.id}`;
      
      console.log('🔍 AsanaInbox: Making API call to:', url);
      console.log('🔍 AsanaInbox: Current organization ID:', currentOrganization.id);
      console.log('🔍 AsanaInbox: Expected to filter for org ID:', currentOrganization.id);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const activities = await response.json();
        console.log('Loaded inbox messages for org', currentOrganization?.id, ':', activities);
        setActivities(activities);
      } else {
        console.error('Failed to load inbox messages, status:', response.status);
        setActivities([]);
      }
    } catch (error) {
      console.error('Failed to load inbox messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project':
      case 'project_created':
        return <FolderKanban className="h-4 w-4 text-blue-500" />;
      case 'project_updated':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'project_deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'task':
      case 'task_created':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'task_updated':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'task_deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'task_assigned':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'project_shared':
        return <Share className="h-4 w-4 text-blue-500" />;
      case 'milestone_created':
        return <Target className="h-4 w-4 text-orange-500" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'unread') return !activity.isRead;
    if (filter === 'high') return activity.priority === 'high';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pl-8 pr-6 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-600">Stay updated with all your activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const updatedActivities = activities.map(a => ({ ...a, isRead: true }));
              setActivities(updatedActivities);
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All', count: activities.length },
            { key: 'unread', label: 'Unread', count: activities.filter(a => !a.isRead).length },
            { key: 'high', label: 'High Priority', count: activities.filter(a => a.priority === 'high').length }
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(key as any)}
              className="relative"
            >
              {label}
              {count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities</h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? 'No unread activities' 
                  : filter === 'high' 
                    ? 'No high priority activities' 
                    : 'No activities yet'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card 
              key={activity.id} 
              className={`transition-all hover:shadow-md ${
                !activity.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(activity.priority)}`}
                        >
                          {activity.priority}
                        </Badge>
                        {!activity.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={activity.user?.avatar} />
                          <AvatarFallback className="text-xs">
                            {typeof activity.user?.name === 'string' 
                              ? activity.user.name.charAt(0) 
                              : activity.user?.name?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {typeof activity.user?.name === 'string' 
                            ? activity.user.name 
                            : activity.user?.name?.name || 'Unknown User'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}