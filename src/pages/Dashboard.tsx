import React, { useState, useEffect } from 'react';
import { AdvancedOrganizationDashboard } from '@/components/AdvancedOrganizationDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Building2, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [activeView, setActiveView] = useState<'user' | 'organization'>('user');
  const [selectedOrg, setSelectedOrg] = useState('1757611193123'); // Use real org ID

  console.log('📊 Dashboard: selectedOrg:', selectedOrg);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Advanced Analytics Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Interactive charts and comprehensive insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={activeView === 'user' ? 'default' : 'outline'}
                onClick={() => setActiveView('user')}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>User View</span>
              </Button>
              <Button
                variant={activeView === 'organization' ? 'default' : 'outline'}
                onClick={() => setActiveView('organization')}
                className="flex items-center space-x-2"
              >
                <Building2 className="h-4 w-4" />
                <span>Organization View</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdvancedOrganizationDashboard 
          organizationId={selectedOrg}
          userRole="ADMIN"
        />
      </div>
    </div>
  );
}
