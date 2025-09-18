// RBAC (Role-Based Access Control) Types

export type PermissionLevel = 'none' | 'specific' | 'all';

export type EntityType = 'projects' | 'tasks' | 'organizations';

export type ActionType = 'create' | 'read' | 'update' | 'delete';

// Organization Roles
export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// User role within an organization
export interface UserOrganizationRole {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  joinedAt: string;
  isActive: boolean;
}

export interface Permission {
  entity: EntityType;
  action: ActionType;
  level: PermissionLevel;
  specificUsers?: string[]; // Array of user IDs who have specific access
}

export interface ProjectPermissions {
  create: Permission;
  read: Permission;
  update: Permission;
  delete: Permission;
  // Extensions
  assignToUser?: Permission;
  manageMembers?: Permission;
}

export interface TaskPermissions {
  create: Permission;
  read: Permission;
  update: Permission;
  delete: Permission;
  // Extensions
  assignToUser?: Permission;
  changeStatus?: Permission;
}

export interface OrganizationPermissions {
  create: Permission;
  read: Permission;
  update: Permission;
  delete: Permission;
  // Extensions
  manageMembers?: Permission;
  manageProjects?: Permission;
}

// Default permission configurations
export const DEFAULT_PROJECT_PERMISSIONS: ProjectPermissions = {
  create: {
    entity: 'projects',
    action: 'create',
    level: 'all'
  },
  read: {
    entity: 'projects',
    action: 'read',
    level: 'all'
  },
  update: {
    entity: 'projects',
    action: 'update',
    level: 'specific',
    specificUsers: [] // Will be set by project creator
  },
  delete: {
    entity: 'projects',
    action: 'delete',
    level: 'specific',
    specificUsers: [] // Will be set by project creator
  },
  assignToUser: {
    entity: 'projects',
    action: 'update',
    level: 'specific',
    specificUsers: []
  },
  manageMembers: {
    entity: 'projects',
    action: 'update',
    level: 'specific',
    specificUsers: []
  }
};

export const DEFAULT_TASK_PERMISSIONS: TaskPermissions = {
  create: {
    entity: 'tasks',
    action: 'create',
    level: 'all'
  },
  read: {
    entity: 'tasks',
    action: 'read',
    level: 'all'
  },
  update: {
    entity: 'tasks',
    action: 'update',
    level: 'all'
  },
  delete: {
    entity: 'tasks',
    action: 'delete',
    level: 'specific',
    specificUsers: []
  },
  assignToUser: {
    entity: 'tasks',
    action: 'update',
    level: 'all'
  },
  changeStatus: {
    entity: 'tasks',
    action: 'update',
    level: 'all'
  }
};

// Permission checking utilities
export class PermissionChecker {
  static hasPermission(
    userId: string,
    entity: EntityType,
    action: ActionType,
    permissions: Permission,
    userRole?: string
  ): boolean {
    // Super admin always has all permissions
    if (userRole === 'super_admin') {
      return true;
    }

    switch (permissions.level) {
      case 'none':
        return false;
      
      case 'all':
        return true;
      
      case 'specific':
        return permissions.specificUsers?.includes(userId) || false;
      
      default:
        return false;
    }
  }

  // Check if user can assign task to specific assignee
  static canAssignTaskToUser(
    assignerId: string,
    assigneeId: string,
    organizationId: string,
    assignerRole: OrganizationRole
  ): boolean {
    // OWNER cannot assign tasks to themselves
    if (assignerRole === 'OWNER' && assignerId === assigneeId) {
      return false;
    }
    
    // ADMIN and MEMBER can assign to anyone (including themselves)
    return true;
  }

  // Get available assignees for task assignment
  static getAvailableAssignees(
    allUsers: any[],
    assignerId: string,
    assignerRole: OrganizationRole,
    organizationId: string
  ): any[] {
    if (assignerRole === 'OWNER') {
      // Owner cannot assign to themselves
      return allUsers.filter(user => user.id !== assignerId);
    }
    
    // Admin and Member can assign to anyone
    return allUsers;
  }

  static canCreateProject(userId: string, permissions: ProjectPermissions, userRole?: string): boolean {
    return this.hasPermission(userId, 'projects', 'create', permissions.create, userRole);
  }

  static canReadProject(userId: string, permissions: ProjectPermissions, userRole?: string): boolean {
    return this.hasPermission(userId, 'projects', 'read', permissions.read, userRole);
  }

  static canUpdateProject(userId: string, permissions: ProjectPermissions, userRole?: string): boolean {
    return this.hasPermission(userId, 'projects', 'update', permissions.update, userRole);
  }

  static canDeleteProject(userId: string, permissions: ProjectPermissions, userRole?: string): boolean {
    return this.hasPermission(userId, 'projects', 'delete', permissions.delete, userRole);
  }

  static canCreateTask(userId: string, permissions: TaskPermissions, userRole?: string): boolean {
    return this.hasPermission(userId, 'tasks', 'create', permissions.create, userRole);
  }

  static canReadTask(userId: string, permissions: TaskPermissions, userRole?: string): boolean {
    return this.hasPermission(userId, 'tasks', 'read', permissions.read, userRole);
  }

  static canUpdateTask(userId: string, permissions: TaskPermissions, userRole?: string): boolean {
    return this.hasPermission(userId, 'tasks', 'update', permissions.update, userRole);
  }

  static canDeleteTask(userId: string, permissions: TaskPermissions, userRole?: string): boolean {
    return this.hasPermission(userId, 'tasks', 'delete', permissions.delete, userRole);
  }
}

// Permission level options for UI
export const PERMISSION_LEVEL_OPTIONS = [
  { value: 'none', label: 'No one', description: 'No one can perform this action' },
  { value: 'specific', label: 'Specific people', description: 'Only selected people can perform this action' },
  { value: 'all', label: 'Everyone', description: 'Everyone can perform this action' }
] as const;
