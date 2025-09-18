import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Calendar, Plus } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { TransactionForm } from './TransactionForm';

interface FinanceDashboardProps {
  orgId: string;
  className?: string;
}

interface FinanceData {
  balance: number;
  month: string;
  incomeMonth: number;
  expenseMonth: number;
  withdraw30: number;
  donut: { name: string; value: number }[];
}

interface Subscription {
  id: string;
  vendor: string;
  amount: number;
  category: string;
  occurredAt: string;
  recurring?: {
    interval: string;
    nextBilling: string;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export function FinanceDashboard({ orgId, className = "" }: FinanceDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState<'category' | 'project'>('category');
  // Initialize socket connection
  useEffect(() => {
    const socket = getSocket();
    
    return () => {
      // Don't disconnect here as it's a shared socket
    };
  }, []);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['finance-summary', orgId, selectedMonth],
    queryFn: async (): Promise<FinanceData> => {
      const response = await fetch(`/api/finance/summary?orgId=${orgId}&month=${selectedMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch finance summary');
      }
      return response.json();
    },
    enabled: !!orgId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: projectData, refetch: refetchProject, isLoading: isLoadingProject } = useQuery({
    queryKey: ['finance-project-spending', orgId, selectedMonth],
    queryFn: async (): Promise<{ month: string; donut: { name: string; value: number; projectId: string; transactionCount: number }[]; totalSpending: number }> => {
      const response = await fetch(`/api/finance/project-spending?orgId=${orgId}&month=${selectedMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project spending');
      }
      return response.json();
    },
    enabled: !!orgId,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions', orgId],
    queryFn: async (): Promise<Subscription[]> => {
      const response = await fetch(`/api/finance/subscriptions?orgId=${orgId}&limit=6`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      return response.json();
    },
    enabled: !!orgId,
  });

  // Listen for real-time updates
  useEffect(() => {
    if (!orgId) return;

    const socket = getSocket();

    const handleFinanceUpdate = (data: { orgId: string }) => {
      if (data.orgId === orgId) {
        console.log('💰 Finance data updated, refetching...');
        refetch();
      }
    };

    socket.on('finance:summary:updated', handleFinanceUpdate);
    
    return () => {
      socket.off('finance:summary:updated', handleFinanceUpdate);
    };
  }, [orgId, refetch]);

  const handleRefresh = () => {
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading finance data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Finance Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Total Balance</h3>
                <p className="text-3xl font-bold text-blue-800">
                  {formatCurrency(data?.balance || 0)}
                </p>
                <div className="mt-2 text-sm text-blue-600">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Income: {formatCurrency(data?.incomeMonth || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    <span>Expense: {formatCurrency(data?.expenseMonth || 0)}</span>
                  </div>
                </div>
              </div>
              <DollarSign className="h-12 w-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">Withdraw</h3>
                <p className="text-3xl font-bold text-green-800">
                  {formatCurrency(data?.withdraw30 || 0)}
                </p>
                <div className="mt-2 text-sm text-green-600">
                  last 30 days
                </div>
              </div>
              <TrendingDown className="h-12 w-12 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown Donut Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Expense Breakdown
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant={viewMode === 'category' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('category')}
              >
                By Category
              </Button>
              
              <Button
                variant={viewMode === 'project' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('project')}
              >
                By Project
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">{data?.month}</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {data?.donut && data.donut.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.donut}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.donut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No expense data available</p>
                  <p className="text-sm">Add transactions to see expense breakdown</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Subscriptions */}
      {subscriptions && subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{sub.vendor}</div>
                    <div className="text-sm text-gray-600 capitalize">{sub.category}</div>
                    {sub.recurring && (
                      <div className="text-xs text-gray-500">
                        Next: {new Date(sub.recurring.nextBilling).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(sub.amount)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(sub.occurredAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Form */}
      <TransactionForm 
        orgId={orgId} 
        onSuccess={() => refetch()} 
      />
    </div>
  );
}
