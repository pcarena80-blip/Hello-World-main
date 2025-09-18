import React from 'react';
import { TeamChat } from './TeamChat';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

export function AsanaMessages() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  // Get organization info from context
  const organizationId = currentOrganization?.id || "default-org";
  const organizationName = currentOrganization?.name || "Organization";
  const userRole = currentOrganization?.userRole || user?.role || "member";

  return (
    <div className="flex-1 bg-gray-50 h-screen p-6">
      <TeamChat 
        organizationId={organizationId}
        organizationName={organizationName}
        userRole={userRole}
      />
    </div>
  );
}