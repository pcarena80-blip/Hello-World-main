import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { invitationService } from '@/services/invitationService';
import { OrganizationInvitation, OrganizationAccess } from '@/types/invitations';

interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  memberCount: number;
  isOwner: boolean;
  userRole: 'super_admin' | 'admin' | 'manager' | 'member' | 'sales_rep' | 'viewer' | null;
  canAccess: boolean;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  setCurrentOrganization: (org: Organization | null) => void;
  loadOrganizations: () => Promise<void>;
  isLoading: boolean;
  pendingInvitations: OrganizationInvitation[];
  loadPendingInvitations: () => Promise<void>;
  checkOrganizationAccess: (organizationId: string) => Promise<OrganizationAccess>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState<OrganizationInvitation[]>([]);

  const loadOrganizations = async () => {
    if (!user?.id) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/organizations', {
        headers: {
          'user-id': user.id.toString(),
          'user-name': user.name || user.email || 'Unknown'
        }
      });
      
      if (response.ok) {
        const orgsData = await response.json();
        console.log('📋 OrganizationContext: Loaded organizations:', orgsData.length);
        
        // Map organizations with proper user role detection
        const mappedOrgs: Organization[] = orgsData.map((org: any) => {
          // Find user's role in this organization
          const member = org.members?.find((m: any) => m.userId === user.id);
          const userRole = member?.role || (org.createdBy === user.id ? 'super_admin' : null);
          
          return {
            id: org.id,
            name: org.name,
            description: org.description,
            createdAt: org.createdAt,
            createdBy: org.createdBy,
            memberCount: org.memberCount,
            isOwner: org.createdBy === user.id,
            userRole: userRole,
            canAccess: true // If we got this org from the API, user has access
          };
        });
        
        setOrganizations(mappedOrgs);

        // Only auto-select if no current organization is set AND no stored preference
        if (!currentOrganization && mappedOrgs.length > 0) {
          console.log('🔍 OrganizationContext: No current organization, checking for stored preference...');
          // Check if there's a stored organization preference
          const storedOrgId = localStorage.getItem('selectedOrganizationId');
          console.log('💾 OrganizationContext: Stored org ID from localStorage:', storedOrgId);
          if (storedOrgId) {
            const storedOrg = mappedOrgs.find(org => org.id === storedOrgId);
            if (storedOrg) {
              console.log('✅ OrganizationContext: Found stored organization:', storedOrg.name, 'ID:', storedOrg.id);
              setCurrentOrganization(storedOrg);
              return; // Don't auto-select if we found a stored preference
            } else {
              console.log('❌ OrganizationContext: Stored organization not found in accessible organizations');
            }
          }
          
          // NO AUTO-SELECTION - Let user choose manually
          console.log('ℹ️ OrganizationContext: No stored preference, waiting for user to select organization');
        } else if (currentOrganization) {
          console.log('ℹ️ OrganizationContext: Current organization already set:', currentOrganization.name, 'ID:', currentOrganization.id);
        }
      } else {
        console.error('Failed to load organizations:', response.statusText);
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load pending invitations
  const loadPendingInvitations = async () => {
    if (!user?.id) {
      setPendingInvitations([]);
      return;
    }

    try {
      const invitations = await invitationService.getPendingInvitations(user.id);
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Failed to load pending invitations:', error);
      setPendingInvitations([]);
    }
  };

  // Check organization access
  const checkOrganizationAccess = async (organizationId: string): Promise<OrganizationAccess> => {
    if (!user?.id) {
      return {
        canAccess: false,
        role: null,
        reason: 'User not authenticated'
      };
    }

    try {
      return await invitationService.checkOrganizationAccess(organizationId, user.id);
    } catch (error) {
      console.error('Failed to check organization access:', error);
      return {
        canAccess: false,
        role: null,
        reason: 'Failed to verify access'
      };
    }
  };

  // Load organizations when user changes
  useEffect(() => {
    console.log('🔄 OrganizationContext: User changed, loading organizations. User ID:', user?.id);
    loadOrganizations();
    loadPendingInvitations();
  }, [user?.id]);

  // Load stored organization preference on mount
  useEffect(() => {
    console.log('🔄 OrganizationContext: Mount effect triggered');
    console.log('🔄 OrganizationContext: User ID:', user?.id);
    console.log('🔄 OrganizationContext: Organizations length:', organizations.length);
    console.log('🔄 OrganizationContext: Current organization:', currentOrganization?.name);
    
    if (user?.id && organizations.length > 0 && !currentOrganization) {
      const storedOrgId = localStorage.getItem('selectedOrganizationId');
      console.log('🔄 OrganizationContext: Stored org ID from localStorage:', storedOrgId);
      
      if (storedOrgId) {
        const storedOrg = organizations.find(org => org.id === storedOrgId && org.canAccess);
        console.log('🔄 OrganizationContext: Found stored org:', storedOrg?.name, 'ID:', storedOrg?.id);
        
        if (storedOrg) {
          console.log('✅ OrganizationContext: Setting stored organization:', storedOrg.name, 'ID:', storedOrg.id);
          setCurrentOrganization(storedOrg);
        } else {
          console.log('❌ OrganizationContext: Stored organization not accessible, clearing selection');
          localStorage.removeItem('selectedOrganizationId');
        }
      }
    }
  }, [user?.id, organizations, currentOrganization]);

  // Reset current organization when organizations change
  useEffect(() => {
    if (currentOrganization && !organizations.find(org => org.id === currentOrganization.id)) {
      setCurrentOrganization(null);
    }
  }, [organizations, currentOrganization]);

  // Custom setCurrentOrganization that also stores the selection
  const handleSetCurrentOrganization = (org: Organization | null) => {
    console.log('🔄 OrganizationContext: Setting current organization to:', org?.name, 'ID:', org?.id);
    console.log('🔄 OrganizationContext: Previous organization was:', currentOrganization?.name, 'ID:', currentOrganization?.id);
    
    // Force update the organization
    setCurrentOrganization(org);
    
    if (org) {
      localStorage.setItem('selectedOrganizationId', org.id);
      console.log('💾 OrganizationContext: Stored organization ID in localStorage:', org.id);
      console.log('✅ OrganizationContext: Organization updated successfully');
    } else {
      localStorage.removeItem('selectedOrganizationId');
      console.log('🗑️ OrganizationContext: Removed organization ID from localStorage');
    }
  };

  const value: OrganizationContextType = {
    currentOrganization,
    organizations,
    setCurrentOrganization: handleSetCurrentOrganization,
    loadOrganizations,
    isLoading,
    pendingInvitations,
    loadPendingInvitations,
    checkOrganizationAccess
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
