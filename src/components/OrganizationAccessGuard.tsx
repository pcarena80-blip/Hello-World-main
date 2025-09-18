import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { invitationService } from '@/services/invitationService';
import { OrganizationAccess, OrganizationInvitation } from '@/types/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Clock, UserPlus, X, CheckCircle, AlertCircle, Crown, Shield, Users, Eye, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface OrganizationAccessGuardProps {
  children: ReactNode;
  organizationId: string;
  requiredRole?: string;
  fallbackComponent?: ReactNode;
}

export const OrganizationAccessGuard: React.FC<OrganizationAccessGuardProps> = ({
  children,
  organizationId,
  requiredRole,
  fallbackComponent
}) => {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [access, setAccess] = useState<OrganizationAccess | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<OrganizationInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user?.id || !organizationId) {
      setIsLoading(false);
      return;
    }

    checkAccess();
  }, [user?.id, organizationId]);

  const checkAccess = async () => {
    try {
      setIsLoading(true);
      const [accessResult, invitations] = await Promise.all([
        invitationService.checkOrganizationAccess(organizationId, user!.id),
        invitationService.getPendingInvitations(user!.id)
      ]);

      setAccess(accessResult);
      setPendingInvitations(invitations.filter(inv => inv.organizationId === organizationId));
    } catch (error) {
      console.error('Error checking organization access:', error);
      setAccess({
        canAccess: false,
        role: null,
        reason: 'Failed to verify access'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setIsProcessing(true);
      await invitationService.acceptInvitation(invitationId);
      toast.success('Invitation accepted! You now have access to this organization.');
      await checkAccess(); // Refresh access status
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      setIsProcessing(true);
      await invitationService.declineInvitation(invitationId);
      toast.success('Invitation declined.');
      await checkAccess(); // Refresh access status
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <Users className="h-4 w-4" />;
      case 'member': return <UserPlus className="h-4 w-4" />;
      case 'sales_rep': return <Briefcase className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return <UserPlus className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking organization access...</p>
        </div>
      </div>
    );
  }

  // If user has access, show the protected content
  if (access?.canAccess) {
    return <>{children}</>;
  }

  // If there's a pending invitation, show invitation UI
  const pendingInvitation = pendingInvitations.find(inv => inv.organizationId === organizationId);
  if (pendingInvitation) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              {getRoleIcon(pendingInvitation.role)}
            </div>
            <CardTitle>Organization Invitation</CardTitle>
            <CardDescription>
              You've been invited to join <strong>{pendingInvitation.organizationName}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="text-sm">
                {getRoleIcon(pendingInvitation.role)}
                <span className="ml-1 capitalize">{pendingInvitation.role.replace('_', ' ')}</span>
              </Badge>
              <p className="text-sm text-muted-foreground">
                Invited by {pendingInvitation.invitedByName}
              </p>
              {pendingInvitation.message && (
                <p className="text-sm italic">"{pendingInvitation.message}"</p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to accept this invitation to access the organization.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={() => handleAcceptInvitation(pendingInvitation.id)}
                disabled={isProcessing}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Invitation
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDeclineInvitation(pendingInvitation.id)}
                disabled={isProcessing}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              <Clock className="h-3 w-3 inline mr-1" />
              Expires {new Date(pendingInvitation.expiresAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no access and no invitation, show access denied
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have access to this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {access?.reason || 'You need to be invited to access this organization.'}
            </AlertDescription>
          </Alert>

          <div className="text-center text-sm text-muted-foreground">
            <p>To access this organization, you need to:</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• Be invited by an organization member</li>
              <li>• Accept the invitation</li>
              <li>• Wait for approval if required</li>
            </ul>
          </div>

          {fallbackComponent || (
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationAccessGuard;
