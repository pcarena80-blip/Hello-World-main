import React, { ReactNode } from 'react';
import { useOrganizationPermissions, useHasPermission, useCanManageUser, useCanPerformAction } from '@/hooks/useOrganizationPermissions';
import { OrganizationRole } from '@/types/invitations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertCircle } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: keyof ReturnType<typeof useOrganizationPermissions>;
  action?: 'create' | 'read' | 'update' | 'delete' | 'manage';
  resource?: 'organization' | 'members' | 'projects' | 'tasks' | 'reports' | 'settings';
  targetUserRole?: OrganizationRole;
  fallbackComponent?: ReactNode;
  showFallback?: boolean;
  requireAll?: boolean; // If true, all conditions must be met
  permissions?: Array<keyof ReturnType<typeof useOrganizationPermissions>>;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  action,
  resource,
  targetUserRole,
  fallbackComponent,
  showFallback = true,
  requireAll = false,
  permissions = []
}) => {
  const hasPermission = useHasPermission(permission!);
  const canManageUser = useCanManageUser(targetUserRole!);
  const canPerformAction = useCanPerformAction(action!, resource!);
  const allPermissions = useOrganizationPermissions();

  // Check if user has the required permission(s)
  const checkPermission = () => {
    if (permissions.length > 0) {
      if (requireAll) {
        return permissions.every(perm => allPermissions[perm]);
      } else {
        return permissions.some(perm => allPermissions[perm]);
      }
    }

    if (permission) {
      return hasPermission;
    }

    if (action && resource) {
      return canPerformAction;
    }

    if (targetUserRole) {
      return canManageUser;
    }

    return true; // No specific permission required
  };

  const hasAccess = checkPermission();

  if (hasAccess) {
    return <>{children}</>;
  }

  if (!showFallback) {
    return null;
  }

  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return (
    <Alert variant="destructive">
      <Lock className="h-4 w-4" />
      <AlertDescription>
        You don't have permission to perform this action.
      </AlertDescription>
    </Alert>
  );
};

// Specific permission guards for common use cases
export const OrganizationManagementGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <PermissionGuard permission="canManageOrganization">
    {children}
  </PermissionGuard>
);

export const MemberManagementGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <PermissionGuard permission="canInviteMembers">
    {children}
  </PermissionGuard>
);

export const ProjectManagementGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <PermissionGuard permission="canCreateProjects">
    {children}
  </PermissionGuard>
);

export const TaskManagementGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <PermissionGuard permission="canCreateTasks">
    {children}
  </PermissionGuard>
);

export const ReportsGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <PermissionGuard permission="canViewReports">
    {children}
  </PermissionGuard>
);

export const SettingsGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <PermissionGuard permission="canManageSettings">
    {children}
  </PermissionGuard>
);

// Guard for managing specific user roles
export const UserManagementGuard: React.FC<{ 
  children: ReactNode; 
  targetUserRole: OrganizationRole;
}> = ({ children, targetUserRole }) => (
  <PermissionGuard targetUserRole={targetUserRole}>
    {children}
  </PermissionGuard>
);

// Guard for specific actions on resources
export const ActionGuard: React.FC<{
  children: ReactNode;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  resource: 'organization' | 'members' | 'projects' | 'tasks' | 'reports' | 'settings';
}> = ({ children, action, resource }) => (
  <PermissionGuard action={action} resource={resource}>
    {children}
  </PermissionGuard>
);

// Guard that requires multiple permissions
export const MultiPermissionGuard: React.FC<{
  children: ReactNode;
  permissions: Array<keyof ReturnType<typeof useOrganizationPermissions>>;
  requireAll?: boolean;
}> = ({ children, permissions, requireAll = false }) => (
  <PermissionGuard permissions={permissions} requireAll={requireAll}>
    {children}
  </PermissionGuard>
);

export default PermissionGuard;
