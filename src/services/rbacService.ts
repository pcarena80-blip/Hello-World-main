export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'super_admin' | 'org_admin' | 'manager' | 'member' | 'viewer';

export interface Permission {
  resource: ResourceType;
  actions: Action[];
  conditions?: PermissionCondition[];
}

export type ResourceType = 
  | 'organization'
  | 'projects'
  | 'tasks'
  | 'goals'
  | 'portfolios'
  | 'insights'
  | 'inbox'
  | 'users'
  | 'settings'
  | 'reports';

export type Action = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'assign'
  | 'manage'
  | 'export'
  | 'invite'
  | 'archive'
  | 'restore';

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';
  value: any;
}

export interface RolePermissions {
  [key: string]: Permission[];
}

export class RBACService {
  private static rolePermissions: RolePermissions = {
    super_admin: [
      { resource: 'organization', actions: ['create', 'read', 'update', 'delete', 'manage'] },
      { resource: 'projects', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage', 'export'] },
      { resource: 'tasks', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage', 'export'] },
      { resource: 'goals', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage', 'export'] },
      { resource: 'portfolios', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage', 'export'] },
      { resource: 'insights', actions: ['read', 'export', 'manage'] },
      { resource: 'inbox', actions: ['read', 'update', 'delete', 'manage'] },
      { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'invite', 'manage'] },
      { resource: 'settings', actions: ['read', 'update', 'manage'] },
      { resource: 'reports', actions: ['read', 'create', 'export', 'manage'] }
    ],
    org_admin: [
      { resource: 'organization', actions: ['read', 'update'] },
      { resource: 'projects', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage', 'export'] },
      { resource: 'tasks', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage', 'export'] },
      { resource: 'goals', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage', 'export'] },
      { resource: 'portfolios', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage', 'export'] },
      { resource: 'insights', actions: ['read', 'export', 'manage'] },
      { resource: 'inbox', actions: ['read', 'update', 'delete', 'manage'] },
      { resource: 'users', actions: ['create', 'read', 'update', 'invite'] },
      { resource: 'settings', actions: ['read', 'update'] },
      { resource: 'reports', actions: ['read', 'create', 'export'] }
    ],
    manager: [
      { resource: 'organization', actions: ['read'] },
      { resource: 'projects', actions: ['create', 'read', 'update', 'assign', 'export'] },
      { resource: 'tasks', actions: ['create', 'read', 'update', 'delete', 'assign', 'export'] },
      { resource: 'goals', actions: ['create', 'read', 'update', 'assign', 'export'] },
      { resource: 'portfolios', actions: ['create', 'read', 'update', 'assign', 'export'] },
      { resource: 'insights', actions: ['read', 'export'] },
      { resource: 'inbox', actions: ['read', 'update'] },
      { resource: 'users', actions: ['read'] },
      { resource: 'settings', actions: ['read'] },
      { resource: 'reports', actions: ['read', 'create', 'export'] }
    ],
    member: [
      { resource: 'organization', actions: ['read'] },
      { resource: 'projects', actions: ['read', 'update'] },
      { resource: 'tasks', actions: ['create', 'read', 'update'] },
      { resource: 'goals', actions: ['read', 'update'] },
      { resource: 'portfolios', actions: ['read'] },
      { resource: 'insights', actions: ['read'] },
      { resource: 'inbox', actions: ['read', 'update'] },
      { resource: 'users', actions: ['read'] },
      { resource: 'settings', actions: ['read'] },
      { resource: 'reports', actions: ['read'] }
    ],
    viewer: [
      { resource: 'organization', actions: ['read'] },
      { resource: 'projects', actions: ['read'] },
      { resource: 'tasks', actions: ['read'] },
      { resource: 'goals', actions: ['read'] },
      { resource: 'portfolios', actions: ['read'] },
      { resource: 'insights', actions: ['read'] },
      { resource: 'inbox', actions: ['read'] },
      { resource: 'users', actions: ['read'] },
      { resource: 'settings', actions: ['read'] },
      { resource: 'reports', actions: ['read'] }
    ]
  };

  static hasPermission(
    user: User,
    resource: ResourceType,
    action: Action,
    context?: any
  ): boolean {
    if (!user.isActive) return false;

    const userPermissions = this.rolePermissions[user.role] || [];
    const resourcePermission = userPermissions.find(p => p.resource === resource);

    if (!resourcePermission) return false;

    const hasAction = resourcePermission.actions.includes(action);
    if (!hasAction) return false;

    // Check conditions if they exist
    if (resourcePermission.conditions) {
      return this.evaluateConditions(resourcePermission.conditions, context);
    }

    return true;
  }

  static canAccessResource(user: User, resource: ResourceType): boolean {
    return this.hasPermission(user, resource, 'read');
  }

  static canCreateResource(user: User, resource: ResourceType): boolean {
    return this.hasPermission(user, resource, 'create');
  }

  static canUpdateResource(user: User, resource: ResourceType): boolean {
    return this.hasPermission(user, resource, 'update');
  }

  static canDeleteResource(user: User, resource: ResourceType): boolean {
    return this.hasPermission(user, resource, 'delete');
  }

  static canManageResource(user: User, resource: ResourceType): boolean {
    return this.hasPermission(user, resource, 'manage');
  }

  static canExportResource(user: User, resource: ResourceType): boolean {
    return this.hasPermission(user, resource, 'export');
  }

  static canInviteUsers(user: User): boolean {
    return this.hasPermission(user, 'users', 'invite');
  }

  static getRoleHierarchy(role: UserRole): number {
    const hierarchy = {
      super_admin: 5,
      org_admin: 4,
      manager: 3,
      member: 2,
      viewer: 1
    };
    return hierarchy[role] || 0;
  }

  static canManageUser(manager: User, targetUser: User): boolean {
    if (manager.id === targetUser.id) return true;
    
    const managerLevel = this.getRoleHierarchy(manager.role);
    const targetLevel = this.getRoleHierarchy(targetUser.role);
    
    return managerLevel > targetLevel;
  }

  static getFilteredData<T>(
    user: User,
    data: T[],
    resource: ResourceType,
    filterField?: string
  ): T[] {
    if (this.canManageResource(user, resource)) {
      return data;
    }

    // Apply role-based filtering
    if (resource === 'projects' || resource === 'tasks') {
      return data.filter((item: any) => {
        // Members can only see their assigned items
        if (user.role === 'member') {
          return item.assignedTo === user.id || item.createdBy === user.id;
        }
        return true;
      });
    }

    return data;
  }

  private static evaluateConditions(
    conditions: PermissionCondition[],
    context: any
  ): boolean {
    return conditions.every(condition => {
      const { field, operator, value } = condition;
      const contextValue = this.getNestedValue(context, field);

      switch (operator) {
        case 'equals':
          return contextValue === value;
        case 'not_equals':
          return contextValue !== value;
        case 'in':
          return Array.isArray(value) && value.includes(contextValue);
        case 'not_in':
          return Array.isArray(value) && !value.includes(contextValue);
        case 'contains':
          return typeof contextValue === 'string' && 
                 typeof value === 'string' && 
                 contextValue.includes(value);
        default:
          return false;
      }
    });
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  static getRoleDisplayName(role: UserRole): string {
    const displayNames = {
      super_admin: 'Super Administrator',
      org_admin: 'Organization Administrator',
      manager: 'Manager',
      member: 'Member',
      viewer: 'Viewer'
    };
    return displayNames[role] || role;
  }

  static getRoleDescription(role: UserRole): string {
    const descriptions = {
      super_admin: 'Full system access with all permissions',
      org_admin: 'Organization-wide administrative access',
      manager: 'Team and project management capabilities',
      member: 'Standard user with project participation',
      viewer: 'Read-only access to organization data'
    };
    return descriptions[role] || '';
  }

  static getOrganizationUsers(organizationId: string, allUsers: User[]): User[] {
    // Filter users to only include those who are members of the specified organization
    return allUsers.filter(user => user.organizationId === organizationId);
  }

  static canAccessUserInOrganization(user: User, targetUserId: string, organizationId: string): boolean {
    // Users can only access other users within their organization
    return user.organizationId === organizationId;
  }
}
