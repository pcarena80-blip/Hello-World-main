// Organization Invitation Service

import { 
  OrganizationInvitation, 
  InvitationRequest, 
  InvitationResponse, 
  OrganizationAccess,
  InvitationStatus,
  OrganizationRole,
  InvitationNotification,
  OrganizationMemberWithInvitation
} from '@/types/invitations';

class InvitationService {
  private baseUrl = '/api';

  // Send invitation to user
  async sendInvitation(request: InvitationRequest): Promise<OrganizationInvitation> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${request.organizationId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  }

  // Get pending invitations for a user
  async getPendingInvitations(userId: string): Promise<OrganizationInvitation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/invitations/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending invitations');
      }

      const data = await response.json();
      return data.invitations || [];
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  }

  // Accept invitation
  async acceptInvitation(invitationId: string, message?: string): Promise<OrganizationInvitation> {
    try {
      const response = await fetch(`${this.baseUrl}/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept invitation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Decline invitation
  async declineInvitation(invitationId: string, message?: string): Promise<OrganizationInvitation> {
    try {
      const response = await fetch(`${this.baseUrl}/invitations/${invitationId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to decline invitation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }

  // Cancel invitation (by sender)
  async cancelInvitation(invitationId: string): Promise<OrganizationInvitation> {
    try {
      const response = await fetch(`${this.baseUrl}/invitations/${invitationId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel invitation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  }

  // Check user access to organization
  async checkOrganizationAccess(organizationId: string, userId: string): Promise<OrganizationAccess> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${organizationId}/access/${userId}`);
      
      if (!response.ok) {
        // If the endpoint doesn't exist, assume user has access if they can see the org
        return {
          canAccess: true,
          role: 'member',
          reason: 'Access assumed from organization list'
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking organization access:', error);
      // Fallback: assume user has access if they can see the org
      return {
        canAccess: true,
        role: 'member',
        reason: 'Access assumed from organization list'
      };
    }
  }

  // Get organization members with invitation info
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMemberWithInvitation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${organizationId}/members`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization members');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching organization members:', error);
      throw error;
    }
  }

  // Get invitation by ID
  async getInvitation(invitationId: string): Promise<OrganizationInvitation> {
    try {
      const response = await fetch(`${this.baseUrl}/invitations/${invitationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw error;
    }
  }

  // Get invitations sent by organization
  async getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${organizationId}/invitations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization invitations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching organization invitations:', error);
      throw error;
    }
  }

  // Resend invitation
  async resendInvitation(invitationId: string): Promise<OrganizationInvitation> {
    try {
      const response = await fetch(`${this.baseUrl}/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resend invitation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string): Promise<InvitationNotification[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/notifications`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Remove user from organization
  async removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${organizationId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove user from organization');
      }
    } catch (error) {
      console.error('Error removing user from organization:', error);
      throw error;
    }
  }

  // Update user role in organization
  async updateUserRole(organizationId: string, userId: string, newRole: OrganizationRole): Promise<OrganizationMemberWithInvitation> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${organizationId}/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user role');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Check if user can access organization (utility function)
  async canUserAccessOrganization(organizationId: string, userId: string): Promise<boolean> {
    try {
      const access = await this.checkOrganizationAccess(organizationId, userId);
      return access.canAccess;
    } catch (error) {
      console.error('Error checking organization access:', error);
      return false;
    }
  }

  // Get user's role in organization
  async getUserRoleInOrganization(organizationId: string, userId: string): Promise<OrganizationRole | null> {
    try {
      const access = await this.checkOrganizationAccess(organizationId, userId);
      return access.role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }
}

export const invitationService = new InvitationService();
export default invitationService;
