import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for invitations (in production, use a database)
const invitations: Array<{
  id: string;
  organizationId: string;
  organizationName: string;
  invitedUserId: string;
  invitedUserEmail: string;
  invitedUserName?: string;
  invitedBy: string;
  invitedByName: string;
  role: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  message?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
}> = [];

// In-memory storage for organization access
const organizationAccess: Array<{
  organizationId: string;
  userId: string;
  role: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  invitedBy: string;
}> = [];

// In-memory storage for notifications
const notifications: Array<{
  id: string;
  type: 'invitation_received' | 'invitation_accepted' | 'invitation_declined' | 'invitation_expired';
  organizationId: string;
  organizationName: string;
  invitationId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  role: string;
  message?: string;
  createdAt: string;
  read: boolean;
}> = [];

// Helper function to check if user has access to organization
const checkOrganizationAccess = (organizationId: string, userId: string) => {
  const access = organizationAccess.find(
    a => a.organizationId === organizationId && a.userId === userId && a.status === 'active'
  );
  
  if (access) {
    return {
      canAccess: true,
      role: access.role,
      reason: 'User is a member of the organization'
    };
  }

  // Check for pending invitation
  const pendingInvitation = invitations.find(
    inv => inv.organizationId === organizationId && 
           inv.invitedUserId === userId && 
           inv.status === 'pending' &&
           new Date(inv.expiresAt) > new Date()
  );

  if (pendingInvitation) {
    return {
      canAccess: false,
      role: null,
      invitationId: pendingInvitation.id,
      invitationStatus: pendingInvitation.status,
      reason: 'User has a pending invitation'
    };
  }

  return {
    canAccess: false,
    role: null,
    reason: 'User is not a member and has no pending invitation'
  };
};

// Send invitation
router.post('/organizations/:organizationId/invitations', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { invitedUserEmail, role, message, expiresInDays = 7 } = req.body;
    const invitedBy = req.headers['x-user-id'] as string;
    const invitedByName = req.headers['x-user-name'] as string;

    if (!invitedUserEmail || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Check if user already has access
    const existingAccess = organizationAccess.find(
      a => a.organizationId === organizationId && a.userId === invitedUserEmail
    );

    if (existingAccess) {
      return res.status(400).json({ error: 'User is already a member of this organization' });
    }

    // Check for existing pending invitation
    const existingInvitation = invitations.find(
      inv => inv.organizationId === organizationId && 
             inv.invitedUserEmail === invitedUserEmail && 
             inv.status === 'pending'
    );

    if (existingInvitation) {
      return res.status(400).json({ error: 'User already has a pending invitation' });
    }

    const invitationId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitation = {
      id: invitationId,
      organizationId,
      organizationName: req.headers['x-organization-name'] as string || 'Organization',
      invitedUserId: invitedUserEmail, // Using email as user ID for simplicity
      invitedUserEmail,
      invitedBy,
      invitedByName,
      role,
      status: 'pending' as const,
      message,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    invitations.push(invitation);

    // Create notification
    const notificationId = uuidv4();
    notifications.push({
      id: notificationId,
      type: 'invitation_received',
      organizationId,
      organizationName: invitation.organizationName,
      invitationId,
      fromUserId: invitedBy,
      fromUserName: invitedByName,
      toUserId: invitedUserEmail,
      toUserName: invitedUserEmail,
      role,
      message,
      createdAt: new Date().toISOString(),
      read: false
    });

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get pending invitations for user
router.get('/users/:userId/invitations/pending', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userInvitations = invitations.filter(
      inv => inv.invitedUserId === userId && inv.status === 'pending'
    );

    res.json(userInvitations);
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({ error: 'Failed to fetch pending invitations' });
  }
});

// Accept invitation
router.post('/invitations/:invitationId/accept', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { message } = req.body;

    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is not pending' });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      invitation.updatedAt = new Date().toISOString();
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date().toISOString();
    invitation.updatedAt = new Date().toISOString();

    // Add user to organization
    const access = {
      organizationId: invitation.organizationId,
      userId: invitation.invitedUserId,
      role: invitation.role,
      status: 'active' as const,
      joinedAt: new Date().toISOString(),
      invitedBy: invitation.invitedBy
    };

    organizationAccess.push(access);

    // Create notification
    const notificationId = uuidv4();
    notifications.push({
      id: notificationId,
      type: 'invitation_accepted',
      organizationId: invitation.organizationId,
      organizationName: invitation.organizationName,
      invitationId,
      fromUserId: invitation.invitedUserId,
      fromUserName: invitation.invitedUserEmail,
      toUserId: invitation.invitedBy,
      toUserName: invitation.invitedByName,
      role: invitation.role,
      message,
      createdAt: new Date().toISOString(),
      read: false
    });

    res.json(invitation);
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Decline invitation
router.post('/invitations/:invitationId/decline', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { message } = req.body;

    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is not pending' });
    }

    // Update invitation status
    invitation.status = 'declined';
    invitation.declinedAt = new Date().toISOString();
    invitation.updatedAt = new Date().toISOString();

    // Create notification
    const notificationId = uuidv4();
    notifications.push({
      id: notificationId,
      type: 'invitation_declined',
      organizationId: invitation.organizationId,
      organizationName: invitation.organizationName,
      invitationId,
      fromUserId: invitation.invitedUserId,
      fromUserName: invitation.invitedUserEmail,
      toUserId: invitation.invitedBy,
      toUserName: invitation.invitedByName,
      role: invitation.role,
      message,
      createdAt: new Date().toISOString(),
      read: false
    });

    res.json(invitation);
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ error: 'Failed to decline invitation' });
  }
});

// Cancel invitation
router.post('/invitations/:invitationId/cancel', async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is not pending' });
    }

    // Update invitation status
    invitation.status = 'cancelled';
    invitation.updatedAt = new Date().toISOString();

    res.json(invitation);
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});

// Check organization access
router.get('/organizations/:organizationId/access/:userId', async (req, res) => {
  try {
    const { organizationId, userId } = req.params;
    
    const access = checkOrganizationAccess(organizationId, userId);
    res.json(access);
  } catch (error) {
    console.error('Error checking organization access:', error);
    res.status(500).json({ error: 'Failed to check organization access' });
  }
});

// Get organization members
router.get('/organizations/:organizationId/members', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const members = organizationAccess
      .filter(access => access.organizationId === organizationId)
      .map(access => ({
        id: uuidv4(),
        userId: access.userId,
        userName: access.userId, // Using email as name for simplicity
        userEmail: access.userId,
        role: access.role,
        status: access.status,
        joinedAt: access.joinedAt,
        invitedBy: access.invitedBy,
        invitedByName: 'System', // Would be fetched from user data in production
        permissions: [] // Would be calculated based on role
      }));

    res.json(members);
  } catch (error) {
    console.error('Error fetching organization members:', error);
    res.status(500).json({ error: 'Failed to fetch organization members' });
  }
});

// Get organization invitations
router.get('/organizations/:organizationId/invitations', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const orgInvitations = invitations.filter(
      inv => inv.organizationId === organizationId
    );

    res.json(orgInvitations);
  } catch (error) {
    console.error('Error fetching organization invitations:', error);
    res.status(500).json({ error: 'Failed to fetch organization invitations' });
  }
});

// Get invitation by ID
router.get('/invitations/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json(invitation);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

// Resend invitation
router.post('/invitations/:invitationId/resend', async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is not pending' });
    }

    // Extend expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    invitation.expiresAt = expiresAt.toISOString();
    invitation.updatedAt = new Date().toISOString();

    res.json(invitation);
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ error: 'Failed to resend invitation' });
  }
});

// Get user notifications
router.get('/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userNotifications = notifications.filter(
      notif => notif.toUserId === userId
    );

    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.post('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = notifications.find(notif => notif.id === notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Remove user from organization
router.delete('/organizations/:organizationId/members/:userId', async (req, res) => {
  try {
    const { organizationId, userId } = req.params;
    
    const accessIndex = organizationAccess.findIndex(
      access => access.organizationId === organizationId && access.userId === userId
    );

    if (accessIndex === -1) {
      return res.status(404).json({ error: 'User not found in organization' });
    }

    organizationAccess.splice(accessIndex, 1);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing user from organization:', error);
    res.status(500).json({ error: 'Failed to remove user from organization' });
  }
});

// Update user role in organization
router.put('/organizations/:organizationId/members/:userId/role', async (req, res) => {
  try {
    const { organizationId, userId } = req.params;
    const { role } = req.body;
    
    const access = organizationAccess.find(
      a => a.organizationId === organizationId && a.userId === userId
    );

    if (!access) {
      return res.status(404).json({ error: 'User not found in organization' });
    }

    access.role = role;

    const member = {
      id: uuidv4(),
      userId: access.userId,
      userName: access.userId,
      userEmail: access.userId,
      role: access.role,
      status: access.status,
      joinedAt: access.joinedAt,
      invitedBy: access.invitedBy,
      invitedByName: 'System',
      permissions: []
    };

    res.json(member);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
