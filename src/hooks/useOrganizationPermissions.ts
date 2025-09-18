import { useMemo } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationRole, canInviteUsers, canManageRole, ROLE_HIERARCHY } from '@/types/invitations';

export interface OrganizationPermissions {
  // Organization Management
  canManageOrganization: boolean;
  canDeleteOrganization: boolean;
  canUpdateOrganizationSettings: boolean;
  
  // Member Management
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canUpdateMemberRoles: boolean;
  canViewAllMembers: boolean;
  
  // Project Management
  canCreateProjects: boolean;
  canEditAllProjects: boolean;
  canDeleteProjects: boolean;
  canAssignProjects: boolean;
  
  // Task Management
  canCreateTasks: boolean;
  canEditAllTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;
  
  // Reports and Analytics
  canViewReports: boolean;
  canExportData: boolean;
  canViewAnalytics: boolean;
  
  // Settings and Integrations
  canManageSettings: boolean;
  canManageIntegrations: boolean;
  canManageBilling: boolean;
}

export const useOrganizationPermissions = (): OrganizationPermissions => {
  const { currentOrganization } = useOrganization();
  
  const userRole = currentOrganization?.userRole;
  const isOwner = currentOrganization?.isOwner;

  return useMemo(() => {
    if (!userRole) {
      return {
        canManageOrganization: false,
        canDeleteOrganization: false,
        canUpdateOrganizationSettings: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canUpdateMemberRoles: false,
        canViewAllMembers: false,
        canCreateProjects: false,
        canEditAllProjects: false,
        canDeleteProjects: false,
        canAssignProjects: false,
        canCreateTasks: false,
        canEditAllTasks: false,
        canDeleteTasks: false,
        canAssignTasks: false,
        canViewReports: false,
        canExportData: false,
        canViewAnalytics: false,
        canManageSettings: false,
        canManageIntegrations: false,
        canManageBilling: false,
      };
    }

    const roleLevel = ROLE_HIERARCHY[userRole];

    return {
      // Organization Management
      canManageOrganization: isOwner || userRole === 'super_admin',
      canDeleteOrganization: isOwner,
      canUpdateOrganizationSettings: ['super_admin', 'admin'].includes(userRole),
      
      // Member Management
      canInviteMembers: canInviteUsers(userRole),
      canRemoveMembers: ['super_admin', 'admin'].includes(userRole),
      canUpdateMemberRoles: ['super_admin', 'admin'].includes(userRole),
      canViewAllMembers: roleLevel >= ROLE_HIERARCHY.member,
      
      // Project Management
      canCreateProjects: roleLevel >= ROLE_HIERARCHY.member,
      canEditAllProjects: ['super_admin', 'admin', 'manager'].includes(userRole),
      canDeleteProjects: ['super_admin', 'admin'].includes(userRole),
      canAssignProjects: ['super_admin', 'admin', 'manager'].includes(userRole),
      
      // Task Management
      canCreateTasks: roleLevel >= ROLE_HIERARCHY.member,
      canEditAllTasks: ['super_admin', 'admin', 'manager'].includes(userRole),
      canDeleteTasks: ['super_admin', 'admin'].includes(userRole),
      canAssignTasks: ['super_admin', 'admin', 'manager'].includes(userRole),
      
      // Reports and Analytics
      canViewReports: roleLevel >= ROLE_HIERARCHY.viewer,
      canExportData: ['super_admin', 'admin', 'manager'].includes(userRole),
      canViewAnalytics: ['super_admin', 'admin', 'manager'].includes(userRole),
      
      // Settings and Integrations
      canManageSettings: ['super_admin', 'admin'].includes(userRole),
      canManageIntegrations: ['super_admin', 'admin'].includes(userRole),
      canManageBilling: isOwner || userRole === 'super_admin',
    };
  }, [userRole, isOwner]);
};

// Hook for checking specific permissions
export const useHasPermission = (permission: keyof OrganizationPermissions): boolean => {
  const permissions = useOrganizationPermissions();
  return permissions[permission];
};

// Hook for checking if user can manage another user
export const useCanManageUser = (targetUserRole: OrganizationRole): boolean => {
  const { currentOrganization } = useOrganization();
  const userRole = currentOrganization?.userRole;
  
  if (!userRole) return false;
  
  return canManageRole(userRole, targetUserRole);
};

// Hook for checking if user can perform action on resource
export const useCanPerformAction = (
  action: 'create' | 'read' | 'update' | 'delete' | 'manage',
  resource: 'organization' | 'members' | 'projects' | 'tasks' | 'reports' | 'settings'
): boolean => {
  const permissions = useOrganizationPermissions();
  
  const actionMap: Record<string, Record<string, keyof OrganizationPermissions>> = {
    create: {
      organization: 'canManageOrganization',
      members: 'canInviteMembers',
      projects: 'canCreateProjects',
      tasks: 'canCreateTasks',
      reports: 'canViewReports',
      settings: 'canManageSettings'
    },
    read: {
      organization: 'canManageOrganization',
      members: 'canViewAllMembers',
      projects: 'canCreateProjects',
      tasks: 'canCreateTasks',
      reports: 'canViewReports',
      settings: 'canManageSettings'
    },
    update: {
      organization: 'canUpdateOrganizationSettings',
      members: 'canUpdateMemberRoles',
      projects: 'canEditAllProjects',
      tasks: 'canEditAllTasks',
      reports: 'canViewReports',
      settings: 'canManageSettings'
    },
    delete: {
      organization: 'canDeleteOrganization',
      members: 'canRemoveMembers',
      projects: 'canDeleteProjects',
      tasks: 'canDeleteTasks',
      reports: 'canViewReports',
      settings: 'canManageSettings'
    },
    manage: {
      organization: 'canManageOrganization',
      members: 'canUpdateMemberRoles',
      projects: 'canAssignProjects',
      tasks: 'canAssignTasks',
      reports: 'canViewAnalytics',
      settings: 'canManageSettings'
    }
  };
  
  const permissionKey = actionMap[action]?.[resource];
  return permissionKey ? permissions[permissionKey] : false;
};

export default useOrganizationPermissions;
