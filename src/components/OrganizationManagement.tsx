import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Users,
  Mail,
  UserPlus,
  Settings,
  MoreHorizontal,
  Crown,
  Shield,
  User,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Lock,
  Unlock
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  memberCount: number;
  isOwner: boolean;
  userRole: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer' | null;
  canAccess: boolean;
  members: Array<{
    userId: string;
    role: 'admin' | 'manager' | 'member';
    joinedAt: string;
    status: 'active' | 'inactive';
    user?: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    status: 'pending' | 'accepted' | 'declined';
    invitedAt: string;
  }>;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  organization: {
    id: string;
    name: string;
    description: string;
  };
  invitedAt: string;
}

export function OrganizationManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [userAccess, setUserAccess] = useState<{[orgId: string]: boolean}>({});
  
  // Create organization state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orgsResponse, invitesResponse] = await Promise.all([
        fetch('/api/organizations', {
          headers: {
            'user-id': user?.id?.toString() || '',
            'user-name': user?.name || user?.email || 'Unknown'
          }
        }),
        fetch(`/api/invitations/${user?.id}`)
      ]);

      const orgsData = orgsResponse.ok ? await orgsResponse.json() : [];
      const invitesData = invitesResponse.ok ? await invitesResponse.json() : { invitations: [] };

      setOrganizations(orgsData);
      setInvitations(invitesData.invitations || []);

      // Set access for all organizations (if they're returned by the API, user has access)
      const accessMap: {[orgId: string]: boolean} = {};
      orgsData.forEach((org: Organization) => {
        accessMap[org.id] = true;
      });
      setUserAccess(accessMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      toast({
        title: 'Error',
        description: 'Organization name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id.toString(),
          'user-name': user.name || user.email || 'Unknown'
        },
        body: JSON.stringify({
          name: orgName,
          description: orgDescription,
          createdBy: user.id,
        }),
        cache: 'no-store',
      });

      if (response.ok) {
        const result = await response.json();
        const newOrg: Organization = {
          id: result.organization?.id || result.id,
          name: result.organization?.name || result.name,
          description: result.organization?.description || result.description,
          memberCount: result.organization?.memberCount || result.memberCount,
          members: result.organization?.members || result.members,
          invitations: result.organization?.invitations || result.invitations || []
        };

        setOrganizations(prev => [newOrg, ...prev]);
        
        // Update user access for the new organization
        setUserAccess(prev => ({
          ...prev,
          [newOrg.id]: true
        }));

        toast({
          title: 'Success',
          description: `Organization "${orgName}" created successfully! You are now the Super Admin.`,
        });

        setOrgName('');
        setOrgDescription('');
        setShowCreateDialog(false);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to create organization',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const loadOrganizationMembers = async (orgId: string) => {
    // Check if user has access before loading members
    if (!userAccess[orgId]) {
      alert('You do not have access to this organization');
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}/members`, {
        headers: {
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const org = organizations.find(o => o.id === orgId);
        if (org) {
          org.members = data.members || data;
          setOrganizations([...organizations]);
        }
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const sendInvitation = async () => {
    if (!selectedOrg || !inviteEmail || !inviteRole) return;

    // Check if user has access before sending invitation
    if (!userAccess[selectedOrg.id]) {
      alert('You do not have access to this organization');
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          invitedBy: user?.id
        })
      });

      if (response.ok) {
        setShowInviteDialog(false);
        setInviteEmail('');
        setInviteRole('member');
        loadOrganizationMembers(selectedOrg.id);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('Failed to send invitation');
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      alert('Failed to accept invitation');
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/decline`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        }
      });

      if (response.ok) {
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to decline invitation');
      }
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      alert('Failed to decline invitation');
    }
  };

  const updateMemberRole = async (orgId: string, userId: string, newRole: string) => {
    // Check if user has access before updating role
    if (!userAccess[orgId]) {
      alert('You do not have access to this organization');
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}/members/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        },
        body: JSON.stringify({ newRole, updatedBy: user?.id })
      });

      if (response.ok) {
        loadOrganizationMembers(orgId);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    }
  };

  const removeMember = async (orgId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    // Check if user has access before removing member
    if (!userAccess[orgId]) {
      alert('You do not have access to this organization');
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        },
        body: JSON.stringify({ removedBy: user?.id })
      });

      if (response.ok) {
        loadOrganizationMembers(orgId);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member':
        return <User className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Organizations</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-gray-600">Manage your organizations and members</p>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  Create a new organization to manage your team and projects
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Organization Name *</label>
                  <Input
                    placeholder="Enter organization name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Enter organization description (optional)"
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrganization} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Organization'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-medium">{invitation.organization.name}</h3>
                    <p className="text-sm text-gray-600">{invitation.organization.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleColor(invitation.role)}>
                        {invitation.role}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Invited {new Date(invitation.invitedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptInvitation(invitation.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => declineInvitation(invitation.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Organizations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => {
          const canAccess = userAccess[org.id] || false;
          const isMember = org.members.some(member => member.userId === user?.id);
          const userRole = org.members.find(member => member.userId === user?.id)?.role;
          const isAdmin = userRole === 'admin';

          return (
            <Card key={org.id} className={`${!canAccess ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <p className="text-sm text-gray-600">{org.description}</p>
                    </div>
                  </div>
                  {!canAccess && (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      <Lock className="h-3 w-3 mr-1" />
                      No Access
                    </Badge>
                  )}
                  {canAccess && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <Unlock className="h-3 w-3 mr-1" />
                      Member
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Members</span>
                    <span className="font-medium">{org.memberCount}</span>
                  </div>

                  {canAccess ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(userRole || 'member')}>
                          {getRoleIcon(userRole || 'member')}
                          {userRole || 'member'}
                        </Badge>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-2">
                          <Dialog open={showInviteDialog && selectedOrg?.id === org.id} onOpenChange={setShowInviteDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => setSelectedOrg(org)}>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Invite
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Invite Member</DialogTitle>
                                <DialogDescription>
                                  Send an invitation to join {org.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Email</label>
                                  <Input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Role</label>
                                  <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="member">Member</SelectItem>
                                      <SelectItem value="manager">Manager</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={sendInvitation}>
                                  Send Invitation
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadOrganizationMembers(org.id)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Members
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        You need to be a member to access this organization
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Members Management Dialog */}
      {selectedOrg && (
        <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Members - {selectedOrg.name}</DialogTitle>
              <DialogDescription>
                Manage organization members and their roles
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedOrg.members.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user?.avatar} />
                      <AvatarFallback>
                        {member.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{member.user?.name || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-600">{member.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRoleColor(member.role)}>
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(newRole) => updateMemberRole(selectedOrg.id, member.userId, newRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeMember(selectedOrg.id, member.userId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
