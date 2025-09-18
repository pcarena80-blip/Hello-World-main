import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationAccessGuard } from '@/components/OrganizationAccessGuard';
import { OrganizationMemberManagement } from '@/components/OrganizationMemberManagement';
import { InvitationNotification } from '@/components/InvitationNotification';
import { PermissionGuard, OrganizationManagementGuard, MemberManagementGuard } from '@/components/PermissionGuard';
import { useOrganizationPermissions } from '@/hooks/useOrganizationPermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Crown, 
  Shield, 
  UserPlus, 
  Mail,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { getRoleDisplayInfo } from '@/types/invitations';

interface OrganizationDashboardProps {
  organizationId: string;
}

export const OrganizationDashboard: React.FC<OrganizationDashboardProps> = ({
  organizationId
}) => {
  const { currentOrganization, pendingInvitations } = useOrganization();
  const permissions = useOrganizationPermissions();
  const [activeTab, setActiveTab] = useState('overview');

  const organizationInvitations = pendingInvitations.filter(
    inv => inv.organizationId === organizationId
  );

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

  return (
    <OrganizationAccessGuard organizationId={organizationId}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {currentOrganization?.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentOrganization?.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentOrganization?.userRole && (
              <Badge variant="outline" className={getRoleDisplayInfo(currentOrganization.userRole).color}>
                {getRoleIcon(currentOrganization.userRole)}
                <span className="ml-1">{getRoleDisplayInfo(currentOrganization.userRole).name}</span>
              </Badge>
            )}
            {currentOrganization?.isOwner && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                <Crown className="h-3 w-3 mr-1" />
                Owner
              </Badge>
            )}
          </div>
        </div>

        {/* Pending Invitations Alert */}
        {organizationInvitations.length > 0 && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              You have {organizationInvitations.length} pending invitation(s) for this organization.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Organization Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Organization Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{currentOrganization?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{currentOrganization?.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Members</p>
                    <p className="text-sm text-muted-foreground">{currentOrganization?.memberCount}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Your Role */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getRoleIcon(currentOrganization?.userRole || 'member')}
                    Your Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="outline" className={getRoleDisplayInfo(currentOrganization?.userRole || 'member').color}>
                      {getRoleIcon(currentOrganization?.userRole || 'member')}
                      <span className="ml-1">{getRoleDisplayInfo(currentOrganization?.userRole || 'member').name}</span>
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {getRoleDisplayInfo(currentOrganization?.userRole || 'member').description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {permissions.canInviteMembers ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">Invite Members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permissions.canCreateProjects ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">Create Projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permissions.canViewReports ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">View Reports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permissions.canManageSettings ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">Manage Settings</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Invitations */}
            {organizationInvitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Pending Invitations
                  </CardTitle>
                  <CardDescription>
                    You have {organizationInvitations.length} pending invitation(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {organizationInvitations.map((invitation) => (
                      <InvitationNotification
                        key={invitation.id}
                        invitation={invitation}
                        onStatusChange={() => {}}
                        onRemove={() => {}}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <MemberManagementGuard>
              <OrganizationMemberManagement organizationId={organizationId} />
            </MemberManagementGuard>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <PermissionGuard permission="canManageSettings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Organization Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your organization settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Settings management will be implemented in the next phase.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <PermissionGuard permission="canViewReports">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Reports & Analytics
                  </CardTitle>
                  <CardDescription>
                    View organization reports and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Reports and analytics will be implemented in the next phase.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationAccessGuard>
  );
};

export default OrganizationDashboard;
