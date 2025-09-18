import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { 
  Users,
  Shield,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/types/tasks';
import { PERMISSION_LEVEL_OPTIONS } from '@/types/rbac';

interface ProjectPermissionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onPermissionsUpdate: (permissions: Project['permissions']) => void;
  availableUsers: Array<{ id: string; name: string; email: string; role: string }>;
}

export function ProjectPermissionsManager({ 
  isOpen, 
  onClose, 
  project, 
  onPermissionsUpdate,
  availableUsers 
}: ProjectPermissionsManagerProps) {
  const { toast } = useToast();
  
  const [permissions, setPermissions] = useState<Project['permissions']>({
    create: { level: 'all', specificUsers: [] },
    read: { level: 'all', specificUsers: [] },
    update: { level: 'specific', specificUsers: [] },
    delete: { level: 'specific', specificUsers: [] },
    assignToUser: { level: 'specific', specificUsers: [] },
    manageMembers: { level: 'specific', specificUsers: [] }
  });

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [showUserSelector, setShowUserSelector] = useState<string | null>(null);

  useEffect(() => {
    if (project.permissions) {
      setPermissions(project.permissions);
    }
  }, [project.permissions]);

  const handlePermissionChange = (action: keyof NonNullable<Project['permissions']>, level: 'none' | 'specific' | 'all') => {
    setPermissions(prev => ({
      ...prev,
      [action]: {
        level,
        specificUsers: level === 'specific' ? (prev?.[action]?.specificUsers || []) : []
      }
    }));
  };

  const handleAddUser = (action: keyof NonNullable<Project['permissions']>, userId: string) => {
    if (!permissions?.[action]?.specificUsers?.includes(userId)) {
      setPermissions(prev => ({
        ...prev,
        [action]: {
          level: 'specific',
          specificUsers: [...(prev?.[action]?.specificUsers || []), userId]
        }
      }));
    }
    setShowUserSelector(null);
  };

  const handleRemoveUser = (action: keyof NonNullable<Project['permissions']>, userId: string) => {
    setPermissions(prev => ({
      ...prev,
      [action]: {
        level: 'specific',
        specificUsers: (prev?.[action]?.specificUsers || []).filter(id => id !== userId)
      }
    }));
  };

  const handleSave = () => {
    onPermissionsUpdate(permissions);
    toast({
      title: "Permissions Updated",
      description: "Project permissions have been updated successfully.",
    });
    onClose();
  };

  const getPermissionIcon = (action: string) => {
    switch (action) {
      case 'create': return <UserPlus className="h-4 w-4" />;
      case 'read': return <Eye className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'assignToUser': return <UserPlus className="h-4 w-4" />;
      case 'manageMembers': return <Settings className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getPermissionColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-red-100 text-red-800';
      case 'specific': return 'bg-yellow-100 text-yellow-800';
      case 'all': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserById = (userId: string) => {
    return availableUsers.find(user => user.id === userId);
  };

  const getAvailableUsersForAction = (action: keyof NonNullable<Project['permissions']>) => {
    const currentUsers = permissions?.[action]?.specificUsers || [];
    return availableUsers.filter(user => !currentUsers.includes(user.id));
  };

  const permissionActions = [
    { key: 'create', label: 'Create Tasks', description: 'Who can create new tasks in this project' },
    { key: 'read', label: 'View Project', description: 'Who can view this project and its tasks' },
    { key: 'update', label: 'Update Tasks', description: 'Who can update existing tasks' },
    { key: 'delete', label: 'Delete Tasks', description: 'Who can delete tasks from this project' },
    { key: 'assignToUser', label: 'Assign Tasks', description: 'Who can assign tasks to users' },
    { key: 'manageMembers', label: 'Manage Members', description: 'Who can add/remove project members' }
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Project Permissions
          </DialogTitle>
          <DialogDescription>
            Configure who can perform different actions on "{project.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {permissionActions.map(({ key, label, description }) => (
            <Card key={key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPermissionIcon(key)}
                    <div>
                      <CardTitle className="text-lg">{label}</CardTitle>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                  </div>
                  <Badge className={getPermissionColor(permissions?.[key]?.level || 'none')}>
                    {permissions?.[key]?.level || 'none'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="w-24">Access Level:</Label>
                  <Select
                    value={permissions?.[key]?.level || 'none'}
                    onValueChange={(value: 'none' | 'specific' | 'all') => 
                      handlePermissionChange(key, value)
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSION_LEVEL_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {permissions?.[key]?.level === 'specific' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Specific Users:</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUserSelector(key)}
                        disabled={getAvailableUsersForAction(key).length === 0}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(permissions?.[key]?.specificUsers || []).map(userId => {
                        const user = getUserById(userId);
                        return user ? (
                          <div
                            key={userId}
                            className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleRemoveUser(key, userId)}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>

                    {showUserSelector === key && (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <Label className="text-sm font-medium">Select User:</Label>
                        <div className="mt-2 space-y-2">
                          {getAvailableUsersForAction(key).map(user => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer"
                              onClick={() => handleAddUser(key, user.id)}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {user.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{user.name}</div>
                                  <div className="text-xs text-gray-500">{user.email}</div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowUserSelector(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {permissions?.[key]?.level === 'none' && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    No one can perform this action
                  </div>
                )}

                {permissions?.[key]?.level === 'all' && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Everyone can perform this action
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Save Permissions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
