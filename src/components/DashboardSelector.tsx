import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { UserDashboard } from './UserDashboard';
import { OrganizationDashboard } from './OrganizationDashboard';
import {
  BarChart3,
  Users,
  Building2,
  User,
  Crown,
  Shield,
  UserCheck,
  Eye,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

type DashboardType = 'user' | 'organization';

interface DashboardSelectorProps {
  className?: string;
}

export function DashboardSelector({ className }: DashboardSelectorProps) {
  const { user } = useAuth();
  const { currentOrganization, organizations } = useOrganization();
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType>('user');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const userOrgs = organizations.filter(org => org.canAccess);
  const canViewOrgDashboard = currentOrganization && 
    ['super_admin', 'admin', 'manager'].includes(currentOrganization.userRole || '');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <UserCheck className="h-4 w-4" />;
      case 'member':
        return <User className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'member':
        return 'Member';
      case 'viewer':
        return 'Viewer';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Type Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Choose your view: personal productivity or organization overview</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedDashboard === 'user' ? 'default' : 'outline'}
            onClick={() => setSelectedDashboard('user')}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            My Dashboard
          </Button>
          {canViewOrgDashboard && (
            <Button
              variant={selectedDashboard === 'organization' ? 'default' : 'outline'}
              onClick={() => setSelectedDashboard('organization')}
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Organization Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Organization Selector for Organization Dashboard */}
      {selectedDashboard === 'organization' && userOrgs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userOrgs.map((org) => (
                <div
                  key={org.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedOrgId === org.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedOrgId(org.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{org.name}</h3>
                    <Badge className={getRoleColor(org.userRole || 'member')}>
                      {getRoleIcon(org.userRole || 'member')}
                      <span className="ml-1">{getRoleName(org.userRole || 'member')}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{org.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {org.memberCount} members
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      Active
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Content */}
      {selectedDashboard === 'user' ? (
        <UserDashboard />
      ) : selectedDashboard === 'organization' ? (
        <OrganizationDashboard organizationId={selectedOrgId || currentOrganization?.id} />
      ) : null}

      {/* Access Denied for Organization Dashboard */}
      {selectedDashboard === 'organization' && !canViewOrgDashboard && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600 mb-4">
              You need Admin, Manager, or Super Admin privileges to view the organization dashboard.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>Your current role:</span>
              <Badge className={getRoleColor(currentOrganization?.userRole || 'member')}>
                {getRoleIcon(currentOrganization?.userRole || 'member')}
                <span className="ml-1">{getRoleName(currentOrganization?.userRole || 'member')}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-2xl font-bold">{userOrgs.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Role</p>
                <p className="text-lg font-bold">
                  {currentOrganization ? getRoleName(currentOrganization.userRole || 'member') : 'None'}
                </p>
              </div>
              {currentOrganization && getRoleIcon(currentOrganization.userRole || 'member')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dashboard Access</p>
                <p className="text-lg font-bold">
                  {canViewOrgDashboard ? 'Full Access' : 'Personal Only'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
