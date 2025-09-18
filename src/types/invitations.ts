// Organization Invitation System Types

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  organizationName: string;
  invitedUserId: string;
  invitedUserEmail: string;
  invitedUserName?: string;
  invitedBy: string;
  invitedByName: string;
  role: OrganizationRole;
  status: InvitationStatus;
  message?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
}

export type InvitationStatus = 
  | 'pending'    // Invitation sent, waiting for response
  | 'accepted'   // User accepted the invitation
  | 'declined'  // User declined the invitation
  | 'expired'   // Invitation expired
  | 'cancelled'; // Invitation cancelled by sender

export type OrganizationRole = 
  | 'super_admin'    // Organization owner - full control
  | 'admin'          // Can manage users, projects, settings
  | 'manager'        // Can manage projects and tasks
  | 'member'         // Standard user - can work on tasks
  | 'sales_rep'      // CRM specialist
  | 'viewer';        // Read-only access

export interface InvitationRequest {
  organizationId: string;
  invitedUserEmail: string;
  role: OrganizationRole;
  message?: string;
  expiresInDays?: number; // Default 7 days
}

export interface InvitationResponse {
  invitationId: string;
  action: 'accept' | 'decline';
  message?: string;
}

export interface OrganizationAccess {
  canAccess: boolean;
  role: OrganizationRole | null;
  invitationId?: string;
  invitationStatus?: InvitationStatus;
  reason?: string; // Why access is denied
}

// Notification types for invitations
export interface InvitationNotification {
  id: string;
  type: 'invitation_received' | 'invitation_accepted' | 'invitation_declined' | 'invitation_expired';
  organizationId: string;
  organizationName: string;
  invitationId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  role: OrganizationRole;
  message?: string;
  createdAt: string;
  read: boolean;
}

// Organization member with invitation info
export interface OrganizationMemberWithInvitation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: OrganizationRole;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  invitedBy: string;
  invitedByName: string;
  invitationId?: string;
  invitationStatus?: InvitationStatus;
  lastActiveAt?: string;
  permissions: string[];
}

// Role hierarchy for permission checking
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

// Check if user can invite others
export const canInviteUsers = (userRole: OrganizationRole): boolean => {
  return ['super_admin', 'admin'].includes(userRole);
};

// Check if user can manage specific role
export const canManageRole = (managerRole: OrganizationRole, targetRole: OrganizationRole): boolean => {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
};

// Get role display information
export const getRoleDisplayInfo = (role: OrganizationRole) => {
  const roleInfo = {
    super_admin: { 
      name: 'Super Admin', 
      description: 'Organization Owner - Full Control', 
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '👑',
      canInvite: true,
      canManageAll: true
    },
    admin: { 
      name: 'Admin', 
      description: 'Organization Administrator', 
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: '🛡️',
      canInvite: true,
      canManageAll: false
    },
    manager: { 
      name: 'Manager', 
      description: 'Team Manager - Project Management', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '👥',
      canInvite: false,
      canManageAll: false
    },
    member: { 
      name: 'Member', 
      description: 'Team Member - Standard Access', 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '👤',
      canInvite: false,
      canManageAll: false
    },
    sales_rep: { 
      name: 'Sales Rep', 
      description: 'Sales Representative - CRM Focus', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '💼',
      canInvite: false,
      canManageAll: false
    },
    viewer: { 
      name: 'Viewer', 
      description: 'Read-Only Access', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '👁️',
      canInvite: false,
      canManageAll: false
    }
  };
  
  return roleInfo[role] || { 
    name: 'Unknown', 
    description: 'Unknown Role', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '❓',
    canInvite: false,
    canManageAll: false
  };
};

// Invitation status display info
export const getInvitationStatusInfo = (status: InvitationStatus) => {
  const statusInfo = {
    pending: {
      name: 'Pending',
      description: 'Waiting for response',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '⏳'
    },
    accepted: {
      name: 'Accepted',
      description: 'User joined the organization',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅'
    },
    declined: {
      name: 'Declined',
      description: 'User declined the invitation',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '❌'
    },
    expired: {
      name: 'Expired',
      description: 'Invitation has expired',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '⏰'
    },
    cancelled: {
      name: 'Cancelled',
      description: 'Invitation was cancelled',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '🚫'
    }
  };
  
  return statusInfo[status] || {
    name: 'Unknown',
    description: 'Unknown Status',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '❓'
  };
};
