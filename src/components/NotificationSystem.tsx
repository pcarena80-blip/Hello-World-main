import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { 
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  UserPlus,
  Calendar,
  Target,
  X,
  MoreHorizontal,
  Settings,
  Mail,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Notification } from '@/types/tasks';

interface NotificationSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  taskAssigned: boolean;
  taskDueSoon: boolean;
  projectChanged: boolean;
  dependencyUnblocked: boolean;
  milestoneReached: boolean;
  projectCompleted: boolean;
}

const NOTIFICATION_TYPES = {
  task_assigned: {
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-700',
    title: 'Task Assigned'
  },
  task_due_soon: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-700',
    title: 'Task Due Soon'
  },
  project_changed: {
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-700',
    title: 'Project Changed'
  },
  dependency_unblocked: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700',
    title: 'Dependency Unblocked'
  },
  milestone_reached: {
    icon: Target,
    color: 'bg-purple-100 text-purple-700',
    title: 'Milestone Reached'
  },
  project_completed: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700',
    title: 'Project Completed'
  }
};

export function NotificationSystem({ isOpen, onClose }: NotificationSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    inApp: true,
    email: true,
    push: false,
    taskAssigned: true,
    taskDueSoon: true,
    projectChanged: true,
    dependencyUnblocked: true,
    milestoneReached: true,
    projectCompleted: true
  });

  // Load notifications when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadPreferences();
    }
  }, [isOpen]);

  // Check for due soon notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkDueSoonNotifications();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch(`/api/notification-preferences?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const checkDueSoonNotifications = async () => {
    try {
      // Check for tasks due in the next 24 hours
      const response = await fetch(`/api/notifications/check-due-soon?userId=${user?.id}`);
      if (response.ok) {
        const newNotifications = await response.json();
        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
          setUnreadCount(prev => prev + newNotifications.length);
        }
      }
    } catch (error) {
      console.error('Failed to check due soon notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/mark-all-read?userId=${user?.id}`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const response = await fetch(`/api/notification-preferences?userId=${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });
      
      if (response.ok) {
        setPreferences(newPreferences);
        toast({
          title: "Preferences Updated",
          description: "Your notification preferences have been saved.",
        });
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderNotification = (notification: Notification) => {
    const typeConfig = NOTIFICATION_TYPES[notification.type];
    const IconComponent = typeConfig.icon;

    return (
      <div
        key={notification.id}
        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
          notification.read ? 'bg-gray-50' : 'bg-white border-blue-200'
        }`}
        onClick={() => markAsRead(notification.id)}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${typeConfig.color}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</span>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            <div className="flex items-center gap-2 mt-2">
              {notification.deliveryChannels.map((channel) => (
                <Badge key={channel} variant="outline" className="text-xs">
                  {channel === 'in-app' && <Eye className="h-3 w-3 mr-1" />}
                  {channel === 'email' && <Mail className="h-3 w-3 mr-1" />}
                  {channel === 'push' && <Smartphone className="h-3 w-3 mr-1" />}
                  {channel}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Delivery Channels</h3>
        <div className="space-y-3">
          {[
            { key: 'inApp', label: 'In-App Notifications', icon: Eye },
            { key: 'email', label: 'Email Notifications', icon: Mail },
            { key: 'push', label: 'Push Notifications', icon: Smartphone }
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </div>
              <Button
                variant={preferences[key as keyof NotificationPreferences] ? "default" : "outline"}
                size="sm"
                onClick={() => updatePreferences({
                  ...preferences,
                  [key]: !preferences[key as keyof NotificationPreferences]
                })}
              >
                {preferences[key as keyof NotificationPreferences] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Notification Types</h3>
        <div className="space-y-3">
          {[
            { key: 'taskAssigned', label: 'Task Assigned' },
            { key: 'taskDueSoon', label: 'Task Due Soon' },
            { key: 'projectChanged', label: 'Project Changed' },
            { key: 'dependencyUnblocked', label: 'Dependency Unblocked' },
            { key: 'milestoneReached', label: 'Milestone Reached' },
            { key: 'projectCompleted', label: 'Project Completed' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <Button
                variant={preferences[key as keyof NotificationPreferences] ? "default" : "outline"}
                size="sm"
                onClick={() => updatePreferences({
                  ...preferences,
                  [key]: !preferences[key as keyof NotificationPreferences]
                })}
              >
                {preferences[key as keyof NotificationPreferences] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Stay updated with project and task notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="h-4 w-4 mr-2 inline" />
              Preferences
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'notifications' ? (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No notifications yet</p>
                    <p className="text-sm">You'll see task assignments and updates here</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                      </p>
                      {unreadCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={markAllAsRead}
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {notifications.map(renderNotification)}
                    </div>
                  </>
                )}
              </div>
            ) : (
              renderPreferences()
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
