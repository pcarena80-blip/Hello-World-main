import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { invitationService } from '@/services/invitationService';
import { 
  OrganizationMemberWithInvitation, 
  OrganizationInvitation, 
  OrganizationRole,
  canInviteUsers,
  canManageRole,
  getRoleDisplayInfo
} from '@/types/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  UserPlus, 
  Mail, 
  MoreVertical, 
  Crown, 
  Shield, 
  Users, 
  User, 
  Briefcase, 
  Eye,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface OrganizationMemberManagementProps {
  organizationId: string;
}

export const OrganizationMemberManagement: React.FC<OrganizationMemberManagementProps> = ({
  organizationId
}) => {
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState<OrganizationMemberWithInvitation[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('member');
  const [inviteMessage, setInviteMessage] = useState('');

  const currentUserRole = currentOrganization?.userRole;
  const canInvite = currentUserRole ? canInviteUsers(currentUserRole) : false;

  useEffect(() => {
    if (organizationId) {
      loadMembersAndInvitations();
    }
  }, [organizationId]);

  const loadMembersAndInvitations = async () => {
    try {
      setIsLoading(true);
      const [membersData, invitationsData] = await Promise.all([
        invitationService.getOrganizationMembers(organizationId),
        invitationService.getOrganizationInvitations(organizationId)
      ]);
      
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading members and invitations:', error);
      toast.error('Failed to load organization members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setIsProcessing(true);
      await invitationService.sendInvitation({
        organizationId,
        invitedUserEmail: inviteEmail.trim(),
        role: inviteRole,
        message: inviteMessage.trim() || undefined
      });

      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteMessage('');
      setInviteRole('member');
      await loadMembersAndInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setIsProcessing(true);
      await invitationService.cancelInvitation(invitationId);
      toast.success('Invitation cancelled');
      await loadMembersAndInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the organization?')) {
      return;
    }

    try {
      setIsProcessing(true);
      await invitationService.removeUserFromOrganization(organizationId, userId);
      toast.success('Member removed from organization');
      await loadMembersAndInvitations();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: OrganizationRole) => {
    try {
      setIsProcessing(true);
      await invitationService.updateUserRole(organizationId, userId, newRole);
      toast.success('Member role updated');
      await loadMembersAndInvitations();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update member role');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleIcon = (role: OrganizationRole) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <Users className="h-4 w-4" />;
      case 'member': return <User className="h-4 w-4" />;
      case 'sales_rep': return <Briefcase className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'suspended': return <X className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organization Members</h2>
          <p className="text-muted-foreground">
            Manage members and send invitations
          </p>
        </div>
        {canInvite && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value: OrganizationRole) => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(getRoleDisplayInfo('member')).map(([key, roleInfo]) => (
                        <SelectItem key={key} value={key as OrganizationRole}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(key as OrganizationRole)}
                            <span>{roleInfo.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal message..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendInvitation} disabled={isProcessing}>
                  {isProcessing ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Active Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Members ({members.filter(m => m.status === 'active').length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members
              .filter(member => member.status === 'active')
              .map((member) => {
                const roleInfo = getRoleDisplayInfo(member.role);
                const canManage = currentUserRole ? canManageRole(currentUserRole, member.role) : false;
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {getRoleIcon(member.role)}
                      </div>
                      <div>
                        <p className="font-medium">{member.userName}</p>
                        <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={roleInfo.color}>
                        {getRoleIcon(member.role)}
                        <span className="ml-1">{roleInfo.name}</span>
                      </Badge>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'admin')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'manager')}>
                              <Users className="h-4 w-4 mr-2" />
                              Make Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'member')}>
                              <User className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'viewer')}>
                              <Eye className="h-4 w-4 mr-2" />
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveMember(member.userId)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.filter(inv => inv.status === 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({invitations.filter(inv => inv.status === 'pending').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations
                .filter(invitation => invitation.status === 'pending')
                .map((invitation) => {
                  const roleInfo = getRoleDisplayInfo(invitation.role);
                  
                  return (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Clock className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">{invitation.invitedUserEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited by {invitation.invitedByName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={roleInfo.color}>
                          {getRoleIcon(invitation.role)}
                          <span className="ml-1">{roleInfo.name}</span>
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganizationMemberManagement;
