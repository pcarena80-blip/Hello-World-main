import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
  Building2,
  Users,
  Settings,
  Crown,
  Shield,
  UserCheck,
  Eye,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  BarChart3,
  FolderKanban,
  CheckSquare,
  Target,
  Bell,
  Key,
  ShieldCheck,
  UserPlus,
  UserMinus,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  memberCount: number;
  isOwner: boolean;
  userRole: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer' | null;
  settings?: {
    allowMemberInvites: boolean;
    requireApprovalForJoins: boolean;
    defaultRole: string;
    timezone: string;
    workingHours: {
      start: string;
      end: string;
    };
    features: {
      projects: boolean;
      tasks: boolean;
      goals: boolean;
      analytics: boolean;
      chat: boolean;
    };
  };
}

interface OrganizationMember {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer';
  joinedAt: string;
  isOwner: boolean;
  status: 'active' | 'pending' | 'suspended';
  lastActive?: string;
  avatar?: string;
}

interface ManageOrganizationWindowProps {
  organization: Organization;
  onClose: () => void;
  onUpdate: (updatedOrg: Organization) => void;
}

export function ManageOrganizationWindow({ organization, onClose, onUpdate }: ManageOrganizationWindowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings' | 'security' | 'billing'>('overview');
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member' as const,
    message: ''
  });
  const [orgSettings, setOrgSettings] = useState(organization.settings || {
    allowMemberInvites: true,
    requireApprovalForJoins: false,
    defaultRole: 'member',
    timezone: 'UTC',
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    features: {
      projects: true,
      tasks: true,
      goals: true,
      analytics: true,
      chat: true
    }
  });

  useEffect(() => {
    loadMembers();
  }, [organization.id]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${organization.id}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        // Fallback to mock data
        setMembers([
          {
            id: user?.id || 1,
            name: user?.name || 'You',
            email: user?.email || 'user@example.com',
            role: 'super_admin',
            joinedAt: organization.createdAt,
            isOwner: true,
            status: 'active',
            lastActive: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembers([
        {
          id: user?.id || 1,
          name: user?.name || 'You',
          email: user?.email || 'user@example.com',
          role: 'super_admin',
          joinedAt: organization.createdAt,
          isOwner: true,
          status: 'active',
          lastActive: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    try {
      const response = await fetch(`/api/organizations/${organization.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...inviteData,
          invitedBy: user?.id,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Invitation sent to ${inviteData.email}`,
        });
        setInviteData({ email: '', role: 'member', message: '' });
        setShowInviteDialog(false);
        loadMembers();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to send invitation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateMemberRole = async (memberId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/organizations/${organization.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMembers(prev => prev.map(member => 
          member.userId === memberId ? { ...member, role: newRole as any } : member
        ));
        toast({
          title: 'Success',
          description: 'Member role updated successfully',
        });
      } else {
        throw new Error('Failed to update member role');
      }
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member from the organization?')) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organization.id}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembers(prev => prev.filter(member => member.userId !== memberId));
        toast({
          title: 'Success',
          description: 'Member removed successfully',
        });
      } else {
        throw new Error('Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`/api/organizations/${organization.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgSettings),
      });

      if (response.ok) {
        const updatedOrg = { ...organization, settings: orgSettings };
        onUpdate(updatedOrg);
        toast({
          title: 'Success',
          description: 'Organization settings updated successfully',
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <UserCheck className="h-4 w-4" />;
      case 'member':
        return <Users className="h-4 w-4" />;
      case 'sales_rep':
        return <UserCheck className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'sales_rep':
        return 'bg-yellow-100 text-yellow-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'member':
        return 'Member';
      case 'sales_rep':
        return 'Sales Rep';
      case 'viewer':
        return 'Viewer';
      default:
        return 'Unknown';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Building2 },
    { id: 'members', name: 'Members', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'security', name: 'Security', icon: ShieldCheck },
    { id: 'billing', name: 'Billing', icon: Key }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-green-600">
                  {Array.isArray(members) ? members.filter(m => m.status === 'active').length : 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-purple-600">12</p>
              </div>
              <FolderKanban className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasks</p>
                <p className="text-2xl font-bold text-orange-600">156</p>
              </div>
              <CheckSquare className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Organization Name</Label>
              <p className="text-lg font-semibold">{organization.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Created</Label>
              <p className="text-lg">{new Date(organization.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-gray-600">Description</Label>
              <p className="text-lg">{organization.description || 'No description provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Organization created</p>
                <p className="text-xs text-gray-500">{new Date(organization.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">First member joined</p>
                <p className="text-xs text-gray-500">{new Date(organization.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Members ({members.length})</h3>
          <p className="text-sm text-gray-600">Manage organization members and their roles</p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <Card key={member.userId}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.user?.avatar} />
                    <AvatarFallback>
                      {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{member.user?.name || 'Unknown User'}</h4>
                      {member.isOwner && (
                        <Badge className="bg-red-100 text-red-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.user?.email || 'No email'}</p>
                    <p className="text-xs text-gray-500">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(member.role)}>
                    {getRoleIcon(member.role)}
                    <span className="ml-1">{getRoleName(member.role)}</span>
                  </Badge>
                  {!member.isOwner && (
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleUpdateMemberRole(member.userId, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="sales_rep">Sales Rep</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {!member.isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Organization Settings</h3>
          <p className="text-sm text-gray-600">Configure your organization preferences</p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <div className="space-y-6">
        {/* Member Management */}
        <Card>
          <CardHeader>
            <CardTitle>Member Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Allow member invites</Label>
                <p className="text-xs text-gray-500">Members can invite new people to the organization</p>
              </div>
              <input
                type="checkbox"
                checked={orgSettings.allowMemberInvites}
                onChange={(e) => setOrgSettings(prev => ({
                  ...prev,
                  allowMemberInvites: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Require approval for joins</Label>
                <p className="text-xs text-gray-500">New members need approval before joining</p>
              </div>
              <input
                type="checkbox"
                checked={orgSettings.requireApprovalForJoins}
                onChange={(e) => setOrgSettings(prev => ({
                  ...prev,
                  requireApprovalForJoins: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Default role for new members</Label>
              <Select
                value={orgSettings.defaultRole}
                onValueChange={(value) => setOrgSettings(prev => ({
                  ...prev,
                  defaultRole: value
                }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(orgSettings.features).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium capitalize">{feature}</Label>
                  <p className="text-xs text-gray-500">Enable {feature} functionality</p>
                </div>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setOrgSettings(prev => ({
                    ...prev,
                    features: {
                      ...prev.features,
                      [feature]: e.target.checked
                    }
                  }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={orgSettings.workingHours.start}
                  onChange={(e) => setOrgSettings(prev => ({
                    ...prev,
                    workingHours: {
                      ...prev.workingHours,
                      start: e.target.value
                    }
                  }))}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">End Time</Label>
                <Input
                  type="time"
                  value={orgSettings.workingHours.end}
                  onChange={(e) => setOrgSettings(prev => ({
                    ...prev,
                    workingHours: {
                      ...prev.workingHours,
                      end: e.target.value
                    }
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Security Settings</h3>
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium mb-2">Security Features</h4>
            <p className="text-gray-600 mb-4">
              Advanced security settings and access controls
            </p>
            <Button variant="outline">
              Configure Security
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Billing & Subscription</h3>
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium mb-2">Billing Management</h4>
            <p className="text-gray-600 mb-4">
              Manage your subscription and billing information
            </p>
            <Button variant="outline">
              View Billing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'members':
        return renderMembers();
      case 'settings':
        return renderSettings();
      case 'security':
        return renderSecurity();
      case 'billing':
        return renderBilling();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">{organization.name}</h2>
              <p className="text-sm text-gray-600">Manage Organization</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join {organization.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value: any) => setInviteData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={inviteData.message}
                onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Add a personal message"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMember}>
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
