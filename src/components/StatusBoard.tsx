import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  Flag, 
  User, 
  GripVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

interface StatusBoardProps {
  items: any[];
  onItemUpdate: (item: any) => void;
  onItemClick: (item: any) => void;
  onItemDelete?: (itemId: string) => void;
  onCreateItem: (statusId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
  itemType: 'project' | 'task';
  customStatuses: CustomStatus[];
}

interface CustomStatus {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface StatusColumn {
  id: string;
  name: string;
  color: string;
  items: any[];
}

export function StatusBoard({ 
  items, 
  onItemUpdate, 
  onItemClick, 
  onItemDelete,
  onCreateItem,
  canEdit,
  canDelete,
  itemType,
  customStatuses 
}: StatusBoardProps) {
  const [statusColumns, setStatusColumns] = useState<StatusColumn[]>([]);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Initialize status columns from custom statuses
  useEffect(() => {
    const sortedStatuses = [...customStatuses].sort((a, b) => a.order - b.order);
    const columns = sortedStatuses.map(status => ({
      id: status.id,
      name: status.name,
      color: status.color,
      items: []
    }));
    setStatusColumns(columns);
  }, [customStatuses]);

  // Update items in columns when items or statuses change
  useEffect(() => {
    if (statusColumns.length === 0) return;

    console.log('StatusBoard: Processing items:', items);
    console.log('StatusBoard: Status columns:', statusColumns);

    const updatedColumns = statusColumns.map(column => {
      const columnItems = items.filter(item => {
        const itemStatus = item.status || item.projectStatus || 'upcoming';
        
        // Map task status names to status IDs
        const statusMapping: { [key: string]: string } = {
          'Upcoming': 'upcoming',
          'In Progress': 'in-progress',
          'Review': 'review',
          'Completed': 'completed',
          'on hold': '1757435278961', // Custom status ID
          'planned': 'upcoming',
          'Planned': 'upcoming', // Map Planned to Upcoming
          'in_progress': 'in-progress',
          'done': 'completed',
          'completed': 'completed'
        };
        
        const mappedStatus = statusMapping[itemStatus] || itemStatus;
        const matches = mappedStatus === column.id;
        
        console.log(`Item ${item.name || item.projectName} (status: ${itemStatus}) -> mapped: ${mappedStatus}, column: ${column.id}, matches: ${matches}`);
        
        return matches;
      });
      
      console.log(`Column ${column.name} (${column.id}): ${columnItems.length} items`);
      
      return {
        ...column,
        items: columnItems
      };
    });
    
    console.log('Updated columns:', updatedColumns);
    setStatusColumns(updatedColumns);
  }, [items, statusColumns.length]);

  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    
    if (draggedItem) {
      const updatedItem = {
        ...draggedItem,
        status: targetStatusId,
        projectStatus: targetStatusId // For projects
      };
      
      onItemUpdate(updatedItem);
      setDraggedItem(null);
    }
  };

  const getItemTitle = (item: any) => {
    return item.title || item.taskName || item.name || item.projectName || 'Untitled';
  };

  const getItemDescription = (item: any) => {
    return item.description || item.projectDescription || '';
  };

  const getItemAssignee = (item: any) => {
    return item.assignee || item.assignedTo || item.assignedUser;
  };

  const getItemDueDate = (item: any) => {
    return item.dueDate || item.endDate || item.deadline;
  };

  const getItemPriority = (item: any) => {
    return item.priority || 'medium';
  };

  const getItemProject = (item: any) => {
    return item.project || item.projectInfo;
  };

  const renderItemCard = (item: any) => {
    const assignee = getItemAssignee(item);
    const dueDate = getItemDueDate(item);
    const priority = getItemPriority(item);
    const project = getItemProject(item);

    return (
      <Card 
        key={item.id} 
        className="cursor-pointer hover:shadow-md transition-shadow mb-3"
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onClick={() => onItemClick(item)}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm line-clamp-2">{getItemTitle(item)}</h4>
              <div className="flex items-center gap-1 ml-2">
                {canEdit && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                {canDelete && onItemDelete && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemDelete(item.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            {getItemDescription(item) && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {getItemDescription(item)}
              </p>
            )}

            {/* Priority */}
            <div className="flex items-center gap-2">
              {priority === 'high' && <Flag className="h-3 w-3 text-red-500" />}
              {priority === 'medium' && <Flag className="h-3 w-3 text-yellow-500" />}
              {priority === 'low' && <Flag className="h-3 w-3 text-green-500" />}
              <span className="text-xs text-gray-500 capitalize">{priority}</span>
            </div>

            {/* Project (for tasks) */}
            {itemType === 'task' && project && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color || '#3B82F6' }}
                />
                <span className="text-xs text-gray-600">{project.name}</span>
              </div>
            )}

            {/* Assignee */}
            {assignee && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee.avatar} />
                  <AvatarFallback className="text-xs">
                    {assignee.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600">{assignee.name}</span>
              </div>
            )}

            {/* Due Date */}
            {dueDate && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {new Date(dueDate).toLocaleDateString()}
              </div>
            )}

            {/* Drag Handle */}
            <div className="flex items-center justify-center pt-2 border-t border-gray-100">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {statusColumns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-gray-50 rounded-lg p-4">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{column.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {column.items.length}
                  </Badge>
                </div>
                {canEdit && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onCreateItem(column.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Items */}
              <div 
                className="space-y-3 min-h-[400px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {column.items.map(renderItemCard)}
                
                {/* Empty State */}
                {column.items.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-sm">No {itemType}s in {column.name}</div>
                    {canEdit && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => onCreateItem(column.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {itemType}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <Flag className="h-3 w-3 text-red-500" />
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="h-3 w-3 text-yellow-500" />
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag className="h-3 w-3 text-green-500" />
            <span>Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <GripVertical className="h-3 w-3 text-gray-400" />
            <span>Drag to move between statuses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
