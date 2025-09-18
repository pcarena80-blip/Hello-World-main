import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from './ui/button';
import { ArrowLeft, Building2, Lock } from 'lucide-react';
import { AsanaLayout } from './AsanaLayout';
import { AsanaHome } from './AsanaHome';
import { AsanaInbox } from './AsanaInbox';
import { AsanaMessages } from './AsanaMessages';
import { AsanaFiles } from './AsanaFiles';
import { MyWorkspace } from './MyWorkspace';
import { EnhancedProjectManagement } from './EnhancedProjectManagement';
import { EnhancedTaskManagement } from './EnhancedTaskManagement';
import { AdvancedTaskManagement } from './AdvancedTaskManagement';
import { AdminConsole } from './AdminConsole';
import { OrganizationManagement } from './OrganizationManagement';
import { CustomStatusManager } from './CustomStatusManager';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
 

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
  members: Array<{
    userId: string;
    role: 'admin' | 'manager' | 'member' | 'viewer';
    joinedAt: string;
    status: 'active' | 'inactive';
  }>;
}

interface AsanaOrganizationProps {
  initialSection?: 'home' | 'my-tasks' | 'inbox' | 'projects' | 'tasks' | 'messages' | 'files' | 'workflow' | 'insights' | 'goals' | 'portfolios' | 'admin' | 'custom-statuses' | 'organizations';
}

export function AsanaOrganization({ initialSection = 'home' }: AsanaOrganizationProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrganization, organizations, setCurrentOrganization, isLoading } = useOrganization();
  const [currentSection, setCurrentSection] = useState<'home' | 'my-tasks' | 'inbox' | 'projects' | 'tasks' | 'messages' | 'files' | 'workflow' | 'insights' | 'goals' | 'portfolios' | 'admin' | 'custom-statuses' | 'organizations'>(initialSection);
  
  // Use selectedOrganization as an alias for currentOrganization for compatibility
  const selectedOrganization = currentOrganization;
  
  // Debug logging
  console.log('🏢 AsanaOrganization: Current organization from context:', currentOrganization?.name, 'ID:', currentOrganization?.id);
  console.log('🏢 AsanaOrganization: Available organizations:', organizations.map(org => ({ name: org.name, id: org.id })));
  
  // Filter, sort, and group state
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('name');
  const [groupBy, setGroupBy] = useState('none');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Update currentSection when initialSection prop changes
  useEffect(() => {
    setCurrentSection(initialSection);
  }, [initialSection]);

  const handleBackToDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Back to Dashboard clicked - navigating to /dashboard');
    navigate('/dashboard');
  };

  // Check if user has access to current organization
  const hasAccess = selectedOrganization ? true : false; // User has access if organization is selected
  const userRole = selectedOrganization?.userRole || null;

  const renderMainContent = () => {
    // Show organization selection if no organization is selected or user doesn't have access
    if (isLoading) {
      return (
        <div className="responsive-organization bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading organizations...</p>
          </div>
        </div>
      );
    }
    
    // Show loading if no organization is selected
    if (!currentOrganization) {
      return (
        <div className="responsive-organization bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading organization...</p>
          </div>
        </div>
      );
    }

    if (!selectedOrganization || !hasAccess) {
      return (
        <div className="responsive-organization bg-gray-50">
          {/* Back Button Header - Fixed Position */}
          <div className="responsive-header px-6 py-4 z-50">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                style={{ zIndex: 9999 }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
          {/* Add top padding to account for fixed header */}
          <div className="responsive-content pt-4">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Organization Access Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {!selectedOrganization ? 'No Organization Selected' : 'Access Denied'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {!selectedOrganization 
                      ? 'Please select an organization to access its content.'
                      : 'You do not have access to this organization. Please contact an admin for access.'
                    }
                  </p>
                  
                  {organizations.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Available Organizations:</h4>
                      <div className="grid gap-3">
                        {organizations.map((org) => {
                          const canAccess = true; // User has access to all organizations they can see
                          const isSelected = selectedOrganization?.id === org.id;
                          return (
                            <div
                              key={org.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-blue-200 bg-blue-50'
                                  : canAccess 
                                    ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                                    : 'border-red-200 bg-red-50 cursor-not-allowed'
                              }`}
                              onClick={() => canAccess && setCurrentOrganization(org)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium">{org.name}</h5>
                                  <p className="text-sm text-gray-600">{org.description}</p>
                                </div>
                                <Badge variant={canAccess ? "default" : "destructive"}>
                                  {canAccess ? 'Accessible' : 'No Access'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    switch (currentSection) {
      case 'home':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
            <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}><AsanaHome /></AsanaLayout>
            </div>
          </div>
        );
      case 'my-tasks':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}>
                <EnhancedTaskManagement 
                  organizationId={selectedOrganization?.id} 
                  userRole={userRole || 'member'} 
                />
              </AsanaLayout>
            </div>
          </div>
        );
      case 'inbox':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}>
                <AsanaInbox key={currentOrganization?.id} />
              </AsanaLayout>
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout 
                currentSection={currentSection} 
                onSectionChange={(section) => setCurrentSection(section as any)}
                filters={filters}
                sortBy={sortBy}
                groupBy={groupBy}
                viewMode={viewMode}
              >
                <EnhancedProjectManagement 
                  organizationId={selectedOrganization.id}
                  userRole={userRole || 'member'}
                />
              </AsanaLayout>
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout 
                currentSection={currentSection} 
                onSectionChange={(section) => setCurrentSection(section as any)}
                filters={filters}
                sortBy={sortBy}
                groupBy={groupBy}
                viewMode={viewMode}
              >
                <AdvancedTaskManagement 
                  organizationId={selectedOrganization?.id}
                  userRole={userRole || 'member'}
                />
              </AsanaLayout>
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}><AsanaMessages /></AsanaLayout>
            </div>
          </div>
        );
      case 'files':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}><AsanaFiles /></AsanaLayout>
            </div>
          </div>
        );
      case 'workflow':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}>
                <MyWorkspace showHeader={false} />
              </AsanaLayout>
            </div>
          </div>
        );
      case 'insights':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                  

                  
                </div>
              </div>
            </div>
          </div>
        );
      case 'goals':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}><MyWorkspace /></AsanaLayout>
            </div>
          </div>
        );
      case 'portfolios':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}><MyWorkspace /></AsanaLayout>
            </div>
          </div>
        );
      case 'admin':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}><AdminConsole /></AsanaLayout>
            </div>
          </div>
        );
      case 'custom-statuses':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}>
                <CustomStatusManager organizationId={selectedOrganization.id} />
              </AsanaLayout>
            </div>
          </div>
        );
      case 'organizations':
        return (
          <div className="responsive-organization bg-gray-50">
            {/* Back Button Header - Fixed Position */}
            <div className="responsive-header px-6 py-4 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:text-gray-900 cursor-pointer"
                    style={{ zIndex: 9999 }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <Badge variant="outline">{userRole}</Badge>
                </div>
              </div>
            </div>
            {/* Add top padding to account for fixed header */}
            <div className="responsive-organization-main pt-4">
              <AsanaLayout currentSection={currentSection} onSectionChange={(section) => setCurrentSection(section as any)}><OrganizationManagement /></AsanaLayout>
            </div>
          </div>
        );
    }
  };

  return renderMainContent();
}