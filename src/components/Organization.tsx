import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ManageOrganizationWindow } from './ManageOrganizationWindow';
import {
  Building2,
  Plus,
  Users,
  Settings,
  Crown,
  Shield,
  UserCheck,
  Eye,
  Trash2,
  Edit,
  ArrowRight,
  Clock,
  Mail,
} from 'lucide-react';
import { AsanaOrganization } from './AsanaOrganization';

interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  memberCount: number;
  isOwner: boolean;
  userRole: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer' | null;
}

interface OrganizationMember {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer';
  joinedAt: string;
  isOwner: boolean;
}

export function Organization() {
  const { user } = useAuth();
  const { organizations, isLoading, loadOrganizations } = useOrganization();
  const { toast } = useToast();
  const loading = isLoading;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedWorkspaceOrg, setSelectedWorkspaceOrg] = useState<Organization | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer'>('member');
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [showInvitationsDialog, setShowInvitationsDialog] = useState(false);

  // Create organization form state
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');

  useEffect(() => {
    handleLoadOrganizations();
    loadPendingInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPendingInvitations = async () => {
    if (user?.id) {
      try {
        const response = await fetch(`/api/invitations/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setPendingInvitations(data.invitations || []);
        }
      } catch (error) {
        console.error('Failed to load pending invitations:', error);
        setPendingInvitations([]);
      }
    }
  };

  // Use the context's loadOrganizations function
  const handleLoadOrganizations = async () => {
    try {
      await loadOrganizations();
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive',
      });
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
      if (selectedOrg) {
        // Update existing organization
        const response = await fetch(`/api/organizations/${selectedOrg.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'user-id': user.id.toString(),
            'user-name': user.name || user.email || 'Unknown'
          },
          body: JSON.stringify({
            name: orgName,
            description: orgDescription,
          }),
          cache: 'no-store',
        });

        if (response.ok) {
          const result = await response.json();
          // Refresh organizations from context
          await loadOrganizations();

          toast({
            title: 'Success',
            description: `Organization "${orgName}" updated successfully!`,
          });

          setOrgName('');
          setOrgDescription('');
          setSelectedOrg(null);
          setShowCreateDialog(false);
        } else {
          const errorData = await response.json();
          toast({
            title: 'Error',
            description: errorData.error || 'Failed to update organization',
            variant: 'destructive',
          });
        }
      } else {
        // Create new organization
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
          // Refresh organizations from context
          await loadOrganizations();

          toast({
            title: 'Success',
            description: `Organization "${orgName}" created successfully! You are now the Super Admin.`,
          });

          setOrgName('');
          setOrgDescription('');
          setShowCreateDialog(false);

          // Show workspace for the newly created organization
          setSelectedWorkspaceOrg(result.organization || result);
        } else {
          const errorData = await response.json();
          toast({
            title: 'Error',
            description: errorData.error || 'Failed to create organization',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Failed to save organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to save organization',
        variant: 'destructive',
      });
    }
  };

  const handleViewMembers = async (org: Organization) => {
    setSelectedOrg(org);
    try {
      const response = await fetch(`/api/organizations/${org.id}/members`, { cache: 'no-store' });
      if (response.ok) {
        const members = await response.json();
        setOrgMembers(members);
      } else {
        setOrgMembers([
          {
            id: typeof user?.id === 'number' ? user.id : (parseInt(user?.id?.toString() || '0', 10) || 0),
            name: (user as any)?.name || 'Unknown',
            email: user?.email || 'unknown@example.com',
            role: 'super_admin',
            joinedAt: org.createdAt,
            isOwner: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      setOrgMembers([
        {
          id: typeof user?.id === 'number' ? user.id : (parseInt(user?.id?.toString() || '0', 10) || 0),
          name: (user as any)?.name || 'Unknown',
          email: user?.email || 'unknown@example.com',
          role: 'super_admin',
          joinedAt: org.createdAt,
          isOwner: true,
        },
      ]);
    }
    setShowMembersDialog(true);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedOrg) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
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
          email: inviteEmail.trim(),
          role: inviteRole,
          invitedBy: user?.id,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteEmail('');
        setInviteRole('member');
        setShowInviteDialog(false);
        // Refresh members list
        handleViewMembers(selectedOrg);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to send invitation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setOrgName(org.name);
    setOrgDescription(org.description);
    setShowCreateDialog(true);
  };

  const handleViewOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setShowMembersDialog(true);
  };

  const handleManageOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setShowManageDialog(true);
  };

  const handleDeleteOrganization = async (org: Organization) => {
    if (!org.isOwner) {
      toast({
        title: 'Error',
        description: 'Only the organization owner can delete the organization',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${org.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh organizations from context
        await loadOrganizations();
        toast({
          title: 'Success',
          description: `Organization "${org.name}" deleted successfully`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to delete organization',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive',
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

  // Show Asana interface if an organization is selected
  if (selectedWorkspaceOrg) {
    return <AsanaOrganization />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Organizations
              </h1>
              <p className="text-gray-600 text-lg">Create and manage your organizations</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedOrg ? 'Edit Organization' : 'Create New Organization'}</DialogTitle>
                  <DialogDescription>
                    {selectedOrg
                      ? 'Update your organization details and settings.'
                      : "Create a new organization to start collaborating with your team. You will become the Super Admin of this organization."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgDescription">Description (Optional)</Label>
                    <Textarea
                      id="orgDescription"
                      value={orgDescription}
                      onChange={(e) => setOrgDescription(e.target.value)}
                      placeholder="Enter organization description"
                      rows={3}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <Crown className="h-5 w-5 text-blue-600 mr-2" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">You will be the Super Admin</p>
                        <p className="text-blue-700">As the creator, you'll have full control over this organization</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateOrganization}>
                      {selectedOrg ? 'Update Organization' : 'Create Organization'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Pending Invitations Banner */}
      {pendingInvitations.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">
                    You have {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-amber-700 text-sm">
                    {pendingInvitations.map(inv => inv.organization.name).join(', ')} invited you to join their organization{pendingInvitations.length !== 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  // Show invitation details in a dialog
                  setShowInvitationsDialog(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                View Invitations
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {organizations.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No organizations yet</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Create your first organization to start collaborating with your team and managing projects
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Organization
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-blue-200/50"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {org.name}
                        </CardTitle>
                        {org.isOwner && (
                          <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200 mt-1">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm line-clamp-2">{org.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-gray-600">Members</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{org.memberCount}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-600">Role</span>
                      </div>
                      <p className="text-sm font-bold text-green-600 capitalize">{org.userRole || 'No Role'}</p>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMembers(org)}
                      className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Members
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOrganization(org)}
                      className="hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrganization(org)}
                      className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageOrganization(org)}
                      className="hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    {org.isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOrganization(org)}
                        className="col-span-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Organization
                      </Button>
                    )}
                  </div>

                  {/* Primary Action Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group"
                    onClick={() => setSelectedWorkspaceOrg(org)}
                    size="lg"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Enter Workspace
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedOrg?.name} - Members
            </DialogTitle>
            <DialogDescription>
              View and manage members of this organization. As the Super Admin, you can invite new members and assign
              roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {Array.isArray(orgMembers) ? orgMembers.length : 0} member{Array.isArray(orgMembers) && orgMembers.length !== 1 ? 's' : ''}
              </p>
              {selectedOrg?.isOwner && (
                <Button size="sm" onClick={() => setShowInviteDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {Array.isArray(orgMembers) && orgMembers.length > 0 ? (
                orgMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(member.role)}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1">{getRoleName(member.role)}</span>
                      </Badge>
                      {member.isOwner && (
                        <Badge className="bg-red-100 text-red-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No members found or loading...</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Invite a new member to {selectedOrg?.name}. They will receive an email invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="inviteRole">Role</Label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="sales_rep">Sales Rep</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMember}>Send Invitation</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Organization Window */}
      {showManageDialog && selectedOrg && (
        <ManageOrganizationWindow
          organization={selectedOrg}
          onClose={() => {
            setShowManageDialog(false);
            setSelectedOrg(null);
          }}
          onUpdate={async (updatedOrg) => {
            // Refresh organizations from context
            await loadOrganizations();
            setShowManageDialog(false);
            setSelectedOrg(null);
          }}
        />
      )}

      {/* Pending Invitations Dialog */}
      <Dialog open={showInvitationsDialog} onOpenChange={setShowInvitationsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvitations.length})
            </DialogTitle>
            <DialogDescription>
              You have been invited to join these organizations. Accept or decline each invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{invitation.organization.name}</h3>
                      <p className="text-gray-600">Invited as: <span className="font-medium">{invitation.role}</span></p>
                      <p className="text-sm text-gray-500">
                        Invited on {new Date(invitation.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/invitations/${invitation.id}/accept`, {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'user-id': user?.id?.toString() || '',
                              'user-name': user?.name || user?.email || 'Unknown'
                            },
                            body: JSON.stringify({ userId: user?.id })
                          });
                          
                          if (response.ok) {
                            toast({
                              title: 'Success',
                              description: `You have joined ${invitation.organization.name}!`,
                            });
                            // Refresh organizations and invitations
                            await loadOrganizations();
                            loadPendingInvitations();
                            setShowInvitationsDialog(false);
                          } else {
                            const error = await response.json();
                            toast({
                              title: 'Error',
                              description: error.error || 'Failed to accept invitation',
                              variant: 'destructive',
                            });
                          }
                        } catch (error) {
                          console.error('Failed to accept invitation:', error);
                          toast({
                            title: 'Error',
                            description: 'Failed to accept invitation',
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/invitations/${invitation.id}/decline`, {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'user-id': user?.id?.toString() || '',
                              'user-name': user?.name || user?.email || 'Unknown'
                            }
                          });
                          
                          if (response.ok) {
                            toast({
                              title: 'Success',
                              description: `Invitation from ${invitation.organization.name} declined.`,
                            });
                            // Refresh invitations
                            loadPendingInvitations();
                          } else {
                            const error = await response.json();
                            toast({
                              title: 'Error',
                              description: error.error || 'Failed to decline invitation',
                              variant: 'destructive',
                            });
                          }
                        } catch (error) {
                          console.error('Failed to decline invitation:', error);
                          toast({
                            title: 'Error',
                            description: 'Failed to decline invitation',
                            variant: 'destructive',
                          });
                        }
                      }}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
