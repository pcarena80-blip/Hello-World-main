import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { invitationService } from '@/services/invitationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, AlertCircle, Shield, Users } from 'lucide-react';

export const OrganizationAccessTest: React.FC = () => {
  const { user } = useAuth();
  const { organizations, currentOrganization } = useOrganization();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runAccessTest = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const results = [];

    try {
      // Test 1: Check all organizations in the system
      const allOrgsResponse = await fetch('/api/organizations', {
        headers: {
          'user-id': user.id,
          'user-name': user.name || user.email
        }
      });
      const allOrgs = await allOrgsResponse.json();

      results.push({
        test: 'Organizations User Can Access',
        status: 'success',
        data: allOrgs,
        message: `User can access ${allOrgs.length} organization(s)`
      });

      // Test 2: Check access to each organization individually
      for (const org of allOrgs) {
        try {
          const accessResponse = await invitationService.checkOrganizationAccess(org.id, user.id);
          results.push({
            test: `Access Check for "${org.name}"`,
            status: accessResponse.canAccess ? 'success' : 'warning',
            data: accessResponse,
            message: accessResponse.canAccess 
              ? `✅ Can access as ${accessResponse.role}` 
              : `❌ Cannot access: ${accessResponse.reason}`
          });
        } catch (error) {
          results.push({
            test: `Access Check for "${org.name}"`,
            status: 'error',
            data: error,
            message: `❌ Error checking access: ${error}`
          });
        }
      }

      // Test 3: Check pending invitations
      try {
        const pendingInvitations = await invitationService.getPendingInvitations(user.id);
        results.push({
          test: 'Pending Invitations',
          status: 'info',
          data: pendingInvitations,
          message: `User has ${pendingInvitations.length} pending invitation(s)`
        });
      } catch (error) {
        results.push({
          test: 'Pending Invitations',
          status: 'error',
          data: error,
          message: `❌ Error fetching invitations: ${error}`
        });
      }

    } catch (error) {
      results.push({
        test: 'General Test',
        status: 'error',
        data: error,
        message: `❌ Test failed: ${error}`
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
      case 'info': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    if (user?.id) {
      runAccessTest();
    }
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Organization Access Control Test
          </CardTitle>
          <CardDescription>
            Testing the invitation-based access control system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={runAccessTest} disabled={isLoading}>
              {isLoading ? 'Running Tests...' : 'Run Access Test'}
            </Button>
            <div className="text-sm text-muted-foreground">
              Current User: {user?.name || user?.email} (ID: {user?.id})
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Current State:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Accessible Organizations</span>
                </div>
                <div className="text-2xl font-bold text-primary">{organizations.length}</div>
                <div className="text-sm text-muted-foreground">
                  {organizations.map(org => org.name).join(', ') || 'None'}
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Current Organization</span>
                </div>
                <div className="text-sm">
                  {currentOrganization ? (
                    <div>
                      <div className="font-medium">{currentOrganization.name}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {currentOrganization.userRole}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Test Results:</h4>
              {testResults.map((result, index) => (
                <Alert key={index}>
                  <div className="flex items-start gap-2">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="font-medium">{result.test}</div>
                        <div className="text-sm mt-1">{result.message}</div>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              View Details
                            </summary>
                            <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </AlertDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationAccessTest;
