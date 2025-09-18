import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Palette, 
  GripVertical,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TaskStatus } from '@/types/tasks';

interface CustomStatusManagerProps {
  organizationId?: string;
  onStatusChange?: () => void;
}

const DEFAULT_COLORS = [
  '#6B7280', // Gray
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
];

export function CustomStatusManager({ organizationId, onStatusChange }: CustomStatusManagerProps) {
  const { toast } = useToast();
  const [customStatuses, setCustomStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: DEFAULT_COLORS[0],
    order: 0
  });

  useEffect(() => {
    loadCustomStatuses();
  }, [organizationId]);

  const loadCustomStatuses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/custom-statuses?organizationId=${organizationId || 'default-org'}`);
      if (response.ok) {
        const data = await response.json();
        setCustomStatuses(data);
      }
    } catch (error) {
      console.error('Failed to load custom statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatus = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Status name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/custom-statuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId: organizationId || 'default-org',
        }),
      });

      if (response.ok) {
        const newStatus = await response.json();
        setCustomStatuses(prev => [...prev, newStatus]);
        setShowCreateDialog(false);
        setFormData({ name: '', color: DEFAULT_COLORS[0], order: 0 });
        onStatusChange?.();
        toast({
          title: 'Success',
          description: 'Custom status created successfully',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to create custom status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create custom status:', error);
      toast({
        title: 'Error',
        description: 'Failed to create custom status',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingStatus || !formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Status name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/custom-statuses/${editingStatus.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedStatus = await response.json();
        setCustomStatuses(prev => 
          prev.map(status => status.id === editingStatus.id ? updatedStatus : status)
        );
        setEditingStatus(null);
        setFormData({ name: '', color: DEFAULT_COLORS[0], order: 0 });
        onStatusChange?.();
        toast({
          title: 'Success',
          description: 'Custom status updated successfully',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to update custom status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update custom status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update custom status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (!confirm('Are you sure you want to delete this custom status?')) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-statuses/${statusId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCustomStatuses(prev => prev.filter(status => status.id !== statusId));
        onStatusChange?.();
        toast({
          title: 'Success',
          description: 'Custom status deleted successfully',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to delete custom status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete custom status:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete custom status',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (status: TaskStatus) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color,
      order: status.order
    });
  };

  const resetForm = () => {
    setFormData({ name: '', color: DEFAULT_COLORS[0], order: 0 });
    setEditingStatus(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Statuses</h2>
          <p className="text-gray-600">Create and manage custom statuses for your tasks and projects</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Status
        </Button>
      </div>

      {/* Status List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customStatuses.map((status) => (
          <Card key={status.id} className="relative group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <CardTitle className="text-lg">{status.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(status)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStatus(status.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">Color:</Label>
                  <div 
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-sm text-gray-500">{status.color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">Order:</Label>
                  <Badge variant="outline">{status.order}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customStatuses.length === 0 && (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No custom statuses</h3>
          <p className="text-gray-600 mb-4">Create your first custom status to get started</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Status
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingStatus} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingStatus(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Edit Custom Status' : 'Create Custom Status'}
            </DialogTitle>
            <DialogDescription>
              {editingStatus 
                ? 'Update the custom status details below.'
                : 'Create a new custom status for your tasks and projects.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Status Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter status name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded border-2 ${
                      formData.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingStatus(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingStatus ? handleUpdateStatus : handleCreateStatus}>
              <Save className="h-4 w-4 mr-2" />
              {editingStatus ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}