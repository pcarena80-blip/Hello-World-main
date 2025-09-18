// Organization-based Role-Based Access Control (RBAC) Types

export interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: number;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  allowGuestAccess: boolean;
  requireEmailVerification: boolean;
  defaultRole: OrganizationRole;
  maxMembers: number;
  features: {
    projects: boolean;
    tasks: boolean;
    chat: boolean;
    reports: boolean;
    integrations: boolean;
  };
}

export type OrganizationRole = 
  | 'super_admin'    // Organization creator - full control (cannot assign tasks to self)
  | 'admin'          // Can manage users, projects, settings (cannot assign tasks to self)
  | 'manager'        // Can manage projects and tasks (cannot assign tasks to self)
  | 'member'         // Standard user - can work on tasks
  | 'sales_rep'      // CRM specialist
  | 'viewer';        // Read-only access

export interface OrganizationMember {
  id: number;
  organizationId: string;
  userId: number;
  role: OrganizationRole;
  joinedAt: string;
  invitedBy: number;
  status: 'active' | 'pending' | 'suspended';
  permissions: OrganizationPermission[];
}

export interface OrganizationPermission {
  id: string;
  name: string;
  description: string;
  category: 'organization' | 'projects' | 'tasks' | 'users' | 'settings' | 'reports' | 'chat';
}

// Define all available permissions
export const ORGANIZATION_PERMISSIONS: Record<string, OrganizationPermission> = {
  // Organization Management
  'manage_organization': {
    id: 'manage_organization',
    name: 'Manage Organization',
    description: 'Full control over organization settings and data',
    category: 'organization'
  },
  'manage_billing': {
    id: 'manage_billing',
    name: 'Manage Billing',
    description: 'Manage subscription and billing',
    category: 'organization'
  },
  
  // User Management
  'manage_users': {
    id: 'manage_users',
    name: 'Manage Users',
    description: 'Invite, remove, and manage organization members',
    category: 'users'
  },
  'assign_roles': {
    id: 'assign_roles',
    name: 'Assign Roles',
    description: 'Assign and change user roles within organization',
    category: 'users'
  },
  
  // Project Management
  'create_projects': {
    id: 'create_projects',
    name: 'Create Projects',
    description: 'Create new projects',
    category: 'projects'
  },
  'edit_projects': {
    id: 'edit_projects',
    name: 'Edit Projects',
    description: 'Edit existing projects',
    category: 'projects'
  },
  'delete_projects': {
    id: 'delete_projects',
    name: 'Delete Projects',
    description: 'Delete projects',
    category: 'projects'
  },
  'view_projects': {
    id: 'view_projects',
    name: 'View Projects',
    description: 'View project details',
    category: 'projects'
  },
  'assign_projects': {
    id: 'assign_projects',
    name: 'Assign Projects',
    description: 'Assign projects to team members',
    category: 'projects'
  },
  
  // Task Management
  'create_tasks': {
    id: 'create_tasks',
    name: 'Create Tasks',
    description: 'Create new tasks',
    category: 'tasks'
  },
  'edit_tasks': {
    id: 'edit_tasks',
    name: 'Edit Tasks',
    description: 'Edit existing tasks',
    category: 'tasks'
  },
  'delete_tasks': {
    id: 'delete_tasks',
    name: 'Delete Tasks',
    description: 'Delete tasks',
    category: 'tasks'
  },
  'view_tasks': {
    id: 'view_tasks',
    name: 'View Tasks',
    description: 'View task details',
    category: 'tasks'
  },
  'assign_tasks': {
    id: 'assign_tasks',
    name: 'Assign Tasks',
    description: 'Assign tasks to team members',
    category: 'tasks'
  },
  'edit_own_tasks': {
    id: 'edit_own_tasks',
    name: 'Edit Own Tasks',
    description: 'Edit tasks they own or are assigned to',
    category: 'tasks'
  },
  
  // Chat and Communication
  'send_messages': {
    id: 'send_messages',
    name: 'Send Messages',
    description: 'Send messages in organization chat',
    category: 'chat'
  },
  'create_channels': {
    id: 'create_channels',
    name: 'Create Channels',
    description: 'Create new chat channels',
    category: 'chat'
  },
  'manage_channels': {
    id: 'manage_channels',
    name: 'Manage Channels',
    description: 'Manage chat channels',
    category: 'chat'
  },
  
  // Reports and Analytics
  'view_reports': {
    id: 'view_reports',
    name: 'View Reports',
    description: 'View organization reports and analytics',
    category: 'reports'
  },
  'export_data': {
    id: 'export_data',
    name: 'Export Data',
    description: 'Export organization data',
    category: 'reports'
  },
  
  // Settings
  'manage_settings': {
    id: 'manage_settings',
    name: 'Manage Settings',
    description: 'Manage organization settings',
    category: 'settings'
  },
  'manage_integrations': {
    id: 'manage_integrations',
    name: 'Manage Integrations',
    description: 'Manage third-party integrations',
    category: 'settings'
  }
};

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<OrganizationRole, string[]> = {
  super_admin: [
    'manage_organization',
    'manage_billing',
    'manage_users',
    'assign_roles',
    'create_projects',
    'edit_projects',
    'delete_projects',
    'view_projects',
    'assign_projects',
    'create_tasks',
    'edit_tasks',
    'delete_tasks',
    'view_tasks',
    'assign_tasks',
    'send_messages',
    'create_channels',
    'manage_channels',
    'view_reports',
    'export_data',
    'manage_settings',
    'manage_integrations'
  ],
  
  admin: [
    'manage_users',
    'assign_roles',
    'create_projects',
    'edit_projects',
    'delete_projects',
    'view_projects',
    'assign_projects',
    'create_tasks',
    'edit_tasks',
    'delete_tasks',
    'view_tasks',
    'assign_tasks',
    'send_messages',
    'create_channels',
    'manage_channels',
    'view_reports',
    'export_data',
    'manage_integrations'
  ],
  
  manager: [
    'create_projects',
    'edit_projects',
    'view_projects',
    'assign_projects',
    'create_tasks',
    'edit_tasks',
    'view_tasks',
    'assign_tasks',
    'send_messages',
    'create_channels',
    'view_reports'
  ],
  
  member: [
    'view_projects',
    'create_tasks',
    'edit_own_tasks',
    'view_tasks',
    'send_messages',
    'view_reports'
  ],
  
  sales_rep: [
    'view_projects',
    'view_tasks',
    'send_messages',
    'view_reports'
  ],
  
  viewer: [
    'view_projects',
    'view_tasks',
    'view_reports'
  ]
};

// Helper functions
export const hasOrganizationPermission = (userRole: OrganizationRole, permissionId: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permissionId);
};

export const canPerformOrganizationAction = (
  userRole: OrganizationRole, 
  action: string, 
  resource: string,
  isOwner: boolean = false
): boolean => {
  // Special case: users can always edit their own resources if they have edit_own_tasks permission
  if (isOwner && action === 'edit' && hasOrganizationPermission(userRole, 'edit_own_tasks')) {
    return true;
  }
  
  // Map actions to permissions
  const actionPermissionMap: Record<string, Record<string, string>> = {
    create: {
      project: 'create_projects',
      task: 'create_tasks',
      channel: 'create_channels'
    },
    edit: {
      project: 'edit_projects',
      task: 'edit_tasks',
      channel: 'manage_channels'
    },
    delete: {
      project: 'delete_projects',
      task: 'delete_tasks',
      channel: 'manage_channels'
    },
    view: {
      project: 'view_projects',
      task: 'view_tasks',
      report: 'view_reports'
    },
    assign: {
      project: 'assign_projects',
      task: 'assign_tasks'
    },
    manage: {
      user: 'manage_users',
      role: 'assign_roles',
      setting: 'manage_settings',
      integration: 'manage_integrations'
    }
  };
  
  const permissionId = actionPermissionMap[action]?.[resource];
  return permissionId ? hasOrganizationPermission(userRole, permissionId) : false;
};

// Role hierarchy for inheritance
export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  super_admin: 6,
  admin: 5,
  manager: 4,
  member: 3,
  sales_rep: 2,
  viewer: 1
};

// Check if one role is higher than another
export const isRoleHigher = (role1: OrganizationRole, role2: OrganizationRole): boolean => {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
};

// Get role display information
export const getOrganizationRoleInfo = (role: OrganizationRole) => {
  const roleInfo = {
    super_admin: { 
      name: 'Super Admin', 
      description: 'Organization Owner', 
      color: 'bg-red-100 text-red-800',
      icon: '👑'
    },
    admin: { 
      name: 'Admin', 
      description: 'Organization Administrator', 
      color: 'bg-purple-100 text-purple-800',
      icon: '🛡️'
    },
    manager: { 
      name: 'Manager', 
      description: 'Team Manager', 
      color: 'bg-blue-100 text-blue-800',
      icon: '👥'
    },
    member: { 
      name: 'Member', 
      description: 'Team Member', 
      color: 'bg-green-100 text-green-800',
      icon: '👤'
    },
    sales_rep: { 
      name: 'Sales Rep', 
      description: 'Sales Representative', 
      color: 'bg-yellow-100 text-yellow-800',
      icon: '💼'
    },
    viewer: { 
      name: 'Viewer', 
      description: 'Read-Only Access', 
      color: 'bg-gray-100 text-gray-800',
      icon: '👁️'
    }
  };
  
  return roleInfo[role] || { 
    name: 'Unknown', 
    description: 'Unknown Role', 
    color: 'bg-gray-100 text-gray-800',
    icon: '❓'
  };
};

// No-self assignment rule utilities
export const ROLES_WITH_NO_SELF_ASSIGNMENT: OrganizationRole[] = ['super_admin', 'admin', 'manager'];

export const canAssignTasksToSelf = (userRole: OrganizationRole): boolean => {
  return !ROLES_WITH_NO_SELF_ASSIGNMENT.includes(userRole);
};

export const getNoSelfAssignmentMessage = (userRole: OrganizationRole): string => {
  const roleInfo = getOrganizationRoleInfo(userRole);
  return `${roleInfo.name}s cannot assign tasks to themselves in this organization. Please assign tasks to other team members.`;
};
