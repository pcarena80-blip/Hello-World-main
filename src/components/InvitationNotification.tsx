import React, { useState } from 'react';
import { OrganizationInvitation, InvitationStatus } from '@/types/invitations';
import { invitationService } from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  X, 
  Clock, 
  Crown, 
  Shield, 
  Users, 
  UserPlus, 
  Briefcase, 
  Eye,
  AlertCircle,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { getRoleDisplayInfo, getInvitationStatusInfo } from '@/types/invitations';

interface InvitationNotificationProps {
  invitation: OrganizationInvitation;
  onStatusChange: (invitationId: string, newStatus: InvitationStatus) => void;
  onRemove: (invitationId: string) => void;
}

export const InvitationNotification: React.FC<InvitationNotificationProps> = ({
  invitation,
  onStatusChange,
  onRemove
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      await invitationService.acceptInvitation(invitation.id);
      onStatusChange(invitation.id, 'accepted');
      toast.success(`You've joined ${invitation.organizationName}!`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsProcessing(true);
      await invitationService.declineInvitation(invitation.id);
      onStatusChange(invitation.id, 'declined');
      toast.success('Invitation declined.');
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    onRemove(invitation.id);
  };

  const roleInfo = getRoleDisplayInfo(invitation.role);
  const statusInfo = getInvitationStatusInfo(invitation.status);
  const isExpired = new Date(invitation.expiresAt) < new Date();

  if (invitation.status === 'accepted') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Invitation Accepted</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            You've successfully joined <strong>{invitation.organizationName}</strong> as a{' '}
            <Badge variant="outline" className="text-xs">
              {getRoleIcon(invitation.role)}
              <span className="ml-1">{roleInfo.name}</span>
            </Badge>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (invitation.status === 'declined') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-800">Invitation Declined</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">
            You declined the invitation to join <strong>{invitation.organizationName}</strong>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isExpired || invitation.status === 'expired') {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-gray-800">Invitation Expired</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            The invitation to join <strong>{invitation.organizationName}</strong> has expired
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800">New Invitation</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-blue-700 mb-2">
            <strong>{invitation.invitedByName}</strong> invited you to join{' '}
            <strong>{invitation.organizationName}</strong>
          </p>
          
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {getRoleIcon(invitation.role)}
              <span className="ml-1">{roleInfo.name}</span>
            </Badge>
            <span className="text-xs text-gray-500">
              {roleInfo.description}
            </span>
          </div>

          {invitation.message && (
            <Alert className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                "{invitation.message}"
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isProcessing}
            className="flex-1"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Decline
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <Clock className="h-3 w-3 inline mr-1" />
          Expires {new Date(invitation.expiresAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvitationNotification;
