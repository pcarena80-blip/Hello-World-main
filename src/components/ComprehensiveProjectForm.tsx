import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Calendar,
  Users,
  Tag,
  Star,
  CheckCircle,
  Plus,
  X,
  Calendar as CalendarIcon,
  UserPlus,
  Target,
  AlertCircle,
  Clock,
  Flag,
  Settings,
  Shield,
  Lock
} from 'lucide-react';
import { AISpellChecker } from './AISpellChecker';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ComprehensiveProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
  organizationId?: string;
}

const PROJECT_STATUSES = [
  { id: 'planned', name: 'Planned', color: '#6B7280' },
  { id: 'in-progress', name: 'In Progress', color: '#3B82F6' },
  { id: 'on-hold', name: 'On Hold', color: '#F59E0B' },
  { id: 'completed', name: 'Completed', color: '#10B981' },
  { id: 'cancelled', name: 'Cancelled', color: '#EF4444' }
];

const PROJECT_PRIORITIES = [
  { id: 'low', name: 'Low', color: '#10B981' },
  { id: 'medium', name: 'Medium', color: '#F59E0B' },
  { id: 'high', name: 'High', color: '#EF4444' },
  { id: 'urgent', name: 'Urgent', color: '#DC2626' }
];

const PROJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
  '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
];

export function ComprehensiveProjectForm({ isOpen, onClose, onProjectCreated, organizationId }: ComprehensiveProjectFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    status: 'planned',
    priority: 'medium',
    startDate: '',
    deadline: '',
    color: '#3B82F6',
    assignedTo: 'unassigned',
    tags: [] as string[],
    team: [] as Array<{ id: number; name: string; email: string; role: string }>,
    isStarred: false,
    budget: {
      allocated: 0,
      used: 0,
      currency: 'USD'
    },
    // RBAC Permissions - Default values
    permissions: {
      create: { level: 'all', specificUsers: [] },
      read: { level: 'all', specificUsers: [] },
      update: { level: 'specific', specificUsers: [user?.id?.toString() || ''] },
      delete: { level: 'specific', specificUsers: [user?.id?.toString() || ''] },
      assignToUser: { level: 'specific', specificUsers: [user?.id?.toString() || ''] },
      manageMembers: { level: 'specific', specificUsers: [user?.id?.toString() || ''] }
    }
  });

  const [newTag, setNewTag] = useState('');
  const [newTeamMember, setNewTeamMember] = useState('');

  // Load available users (organization-specific)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (!organizationId) {
          setAvailableUsers([]);
          return;
        }
        
        const response = await fetch(`/api/organizations/${organizationId}/users`);
        if (response.ok) {
          const users = await response.json();
          setAvailableUsers(users);
        } else {
          console.error('Failed to load organization users');
          setAvailableUsers([]);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
        setAvailableUsers([]);
      }
    };
    
    if (isOpen && organizationId) {
      loadUsers();
    }
  }, [isOpen, organizationId]);

  const handleCreateProject = async () => {
    if (!formData.projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.deadline) {
      toast({
        title: "Error",
        description: "Project deadline is required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        projectName: formData.projectName,
        description: formData.description,
        status: PROJECT_STATUSES.find(s => s.id === formData.status)?.name || 'Planned',
        priority: PROJECT_PRIORITIES.find(p => p.id === formData.priority)?.name || 'Medium',
        startDate: formData.startDate || undefined,
        deadline: formData.deadline,
        color: formData.color,
        assignedTo: formData.assignedTo === 'unassigned' ? 'Unassigned' : formData.assignedTo,
        tags: formData.tags,
        team: formData.team,
        isStarred: formData.isStarred,
        budget: formData.budget,
        organizationId: organizationId || 'default-org',
        createdBy: {
          id: user?.id || 0,
          name: user?.name || '',
          email: user?.email || ''
        },
        // Default RBAC permissions - project creator gets full control
        permissions: {
          create: { level: 'all', specificUsers: [] },
          read: { level: 'all', specificUsers: [] },
          update: { level: 'specific', specificUsers: [user?.id?.toString() || ''] },
          delete: { level: 'specific', specificUsers: [user?.id?.toString() || ''] },
          assignToUser: { level: 'specific', specificUsers: [user?.id?.toString() || ''] },
          manageMembers: { level: 'specific', specificUsers: [user?.id?.toString() || ''] }
        }
      };

      // Create project
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const createdProject = await projectResponse.json();

      toast({
        title: "Project Created",
        description: `Project "${createdProject.projectName}" created successfully.`,
      });

      onProjectCreated(createdProject);
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const addTeamMember = () => {
    const selectedUser = availableUsers.find(u => u.id.toString() === newTeamMember);
    if (selectedUser && !formData.team.find(m => m.id === selectedUser.id)) {
      setFormData({
        ...formData,
        team: [...formData.team, { ...selectedUser, role: 'member' }]
      });
      setNewTeamMember('');
    }
  };

  const removeTeamMember = (memberId: number) => {
    setFormData({ ...formData, team: formData.team.filter(m => m.id !== memberId) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Set up a comprehensive project with all necessary details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <AISpellChecker
                  text={formData.projectName}
                  onTextChange={(text) => setFormData({ ...formData, projectName: text })}
                  placeholder="Enter project name"
                  className="min-h-[40px]"
                  rows={1}
                />
              </div>
              <div>
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.name}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <AISpellChecker
                text={formData.description}
                onTextChange={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe the project goals and objectives"
                rows={4}
              />
            </div>
          </div>

          {/* Status and Priority */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Status & Priority
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_PRIORITIES.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: priority.color }}
                          />
                          {priority.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  All tasks must be completed by this date
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter a tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* RBAC PERMISSIONS - FUNCTIONAL CONTROLS */}
          <div className="space-y-4 border-2 border-blue-200 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              🔐 RBAC PERMISSIONS (Role-Based Access Control)
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Set who can perform different actions on this project. This is the RBAC system you requested!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Tasks Permission */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800">Create Tasks</Label>
                <select
                  value={formData.permissions?.create?.level || 'all'}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      create: { level: e.target.value, specificUsers: [] }
                    }
                  })}
                  className="w-full p-2 border border-blue-300 rounded-md text-sm"
                >
                  <option value="all">Everyone (All)</option>
                  <option value="specific">Specific Users</option>
                  <option value="none">No One (None)</option>
                </select>
              </div>
              
              {/* View Project Permission */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800">View Project</Label>
                <select
                  value={formData.permissions?.read?.level || 'all'}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      read: { level: e.target.value, specificUsers: [] }
                    }
                  })}
                  className="w-full p-2 border border-blue-300 rounded-md text-sm"
                >
                  <option value="all">Everyone (All)</option>
                  <option value="specific">Specific Users</option>
                  <option value="none">No One (None)</option>
                </select>
              </div>
              
              {/* Update Tasks Permission */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800">Update Tasks</Label>
                <select
                  value={formData.permissions?.update?.level || 'specific'}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      update: { level: e.target.value, specificUsers: e.target.value === 'specific' ? [user?.id?.toString() || ''] : [] }
                    }
                  })}
                  className="w-full p-2 border border-blue-300 rounded-md text-sm"
                >
                  <option value="all">Everyone (All)</option>
                  <option value="specific">Only You (Specific)</option>
                  <option value="none">No One (None)</option>
                </select>
              </div>
              
              {/* Delete Tasks Permission */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800">Delete Tasks</Label>
                <select
                  value={formData.permissions?.delete?.level || 'specific'}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      delete: { level: e.target.value, specificUsers: e.target.value === 'specific' ? [user?.id?.toString() || ''] : [] }
                    }
                  })}
                  className="w-full p-2 border border-blue-300 rounded-md text-sm"
                >
                  <option value="all">Everyone (All)</option>
                  <option value="specific">Only You (Specific)</option>
                  <option value="none">No One (None)</option>
                </select>
              </div>
              
              {/* Assign Tasks Permission */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800">Assign Tasks</Label>
                <select
                  value={formData.permissions?.assignToUser?.level || 'specific'}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      assignToUser: { level: e.target.value, specificUsers: e.target.value === 'specific' ? [user?.id?.toString() || ''] : [] }
                    }
                  })}
                  className="w-full p-2 border border-blue-300 rounded-md text-sm"
                >
                  <option value="all">Everyone (All)</option>
                  <option value="specific">Only You (Specific)</option>
                  <option value="none">No One (None)</option>
                </select>
              </div>
              
              {/* Manage Members Permission */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800">Manage Members</Label>
                <select
                  value={formData.permissions?.manageMembers?.level || 'specific'}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      manageMembers: { level: e.target.value, specificUsers: e.target.value === 'specific' ? [user?.id?.toString() || ''] : [] }
                    }
                  })}
                  className="w-full p-2 border border-blue-300 rounded-md text-sm"
                >
                  <option value="all">Everyone (All)</option>
                  <option value="specific">Only You (Specific)</option>
                  <option value="none">No One (None)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> After creating this project, you can change these permissions by going to Projects → 
                Click the blue "Permissions" button on any project card → Manage detailed permissions.
              </p>
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select
                  value={newTeamMember}
                  onValueChange={(value) => setNewTeamMember(value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers
                      .filter(user => !formData.team.find(m => m.id === user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {user.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={addTeamMember} variant="outline">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeamMember(member.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Color */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Project Color
            </h3>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Budget (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="allocated">Allocated Budget</Label>
                <Input
                  id="allocated"
                  type="number"
                  value={formData.budget.allocated}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: { ...formData.budget, allocated: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="used">Used Budget</Label>
                <Input
                  id="used"
                  type="number"
                  value={formData.budget.used}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: { ...formData.budget, used: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.budget.currency}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    budget: { ...formData.budget, currency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={loading || !formData.projectName.trim() || !formData.deadline}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
