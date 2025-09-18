import React, { useState, useRef, useEffect } from 'react';
import { Task } from '@/types/tasks';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Calendar, 
  Clock, 
  Flag, 
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  zoom: 'week' | 'month' | 'quarter';
  onZoomChange: (zoom: 'week' | 'month' | 'quarter') => void;
  startDate: Date;
  onStartDateChange: (date: Date) => void;
}

interface TimelineTask extends Task {
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  dependencies: string[];
}

export function TimelineView({ 
  tasks, 
  onTaskUpdate, 
  onTaskClick, 
  zoom, 
  onZoomChange, 
  startDate, 
  onStartDateChange 
}: TimelineViewProps) {
  const [draggedTask, setDraggedTask] = useState<TimelineTask | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Convert tasks to timeline format
  const timelineTasks: TimelineTask[] = tasks.map(task => {
    const start = task.startDate ? new Date(task.startDate) : new Date();
    const end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    
    return {
      ...task,
      startDate: start,
      endDate: end,
      duration,
      dependencies: task.dependencies || []
    };
  });

  // Calculate timeline dimensions
  const getTimelineWidth = () => {
    switch (zoom) {
      case 'week': return 7 * 120; // 7 days * 120px per day
      case 'month': return 30 * 40; // 30 days * 40px per day
      case 'quarter': return 90 * 15; // 90 days * 15px per day
      default: return 30 * 40;
    }
  };

  const getDayWidth = () => {
    switch (zoom) {
      case 'week': return 120;
      case 'month': return 40;
      case 'quarter': return 15;
      default: return 40;
    }
  };

  const getTaskPosition = (task: TimelineTask) => {
    const dayWidth = getDayWidth();
    const startOffset = Math.max(0, (task.startDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const width = task.duration * dayWidth;
    
    return {
      left: startOffset * dayWidth,
      width: Math.max(60, width) // Minimum width for visibility
    };
  };

  const getDateHeaders = () => {
    const headers = [];
    const dayWidth = getDayWidth();
    const totalDays = zoom === 'week' ? 7 : zoom === 'month' ? 30 : 90;
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      headers.push(
        <div 
          key={i} 
          className="flex-shrink-0 text-center border-r border-gray-200"
          style={{ width: dayWidth }}
        >
          <div className="text-xs font-medium text-gray-600 py-2">
            {date.getDate()}
          </div>
          <div className="text-xs text-gray-500">
            {date.toLocaleDateString('en', { weekday: 'short' })}
          </div>
        </div>
      );
    }
    
    return headers;
  };

  const handleMouseDown = (e: React.MouseEvent, task: TimelineTask) => {
    e.preventDefault();
    setDraggedTask(task);
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !draggedTask || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const dayWidth = getDayWidth();
    const newStartDay = Math.round(x / dayWidth);
    
    if (newStartDay >= 0) {
      const newStartDate = new Date(startDate);
      newStartDate.setDate(newStartDate.getDate() + newStartDay);
      
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + draggedTask.duration - 1);
      
      // Update task in real-time (visual feedback)
      const updatedTask = {
        ...draggedTask,
        startDate: newStartDate,
        endDate: newEndDate,
        startDate: newStartDate.toISOString(),
        dueDate: newEndDate.toISOString()
      };
      
      onTaskUpdate(updatedTask);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && draggedTask) {
      // Final update
      onTaskUpdate(draggedTask);
    }
    
    setDraggedTask(null);
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, draggedTask, dragOffset]);

  const navigateTimeline = (direction: 'prev' | 'next') => {
    const newDate = new Date(startDate);
    const days = zoom === 'week' ? 7 : zoom === 'month' ? 30 : 90;
    
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - days);
    } else {
      newDate.setDate(newDate.getDate() + days);
    }
    
    onStartDateChange(newDate);
  };

  const isOverdue = (task: TimelineTask) => {
    return task.endDate < new Date() && task.status !== 'completed';
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Timeline Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Timeline View</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTimeline('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTimeline('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {startDate.toLocaleDateString()} - {new Date(startDate.getTime() + (zoom === 'week' ? 7 : zoom === 'month' ? 30 : 90) * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={zoom === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onZoomChange('week')}
            >
              Week
            </Button>
            <Button
              variant={zoom === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onZoomChange('month')}
            >
              Month
            </Button>
            <Button
              variant={zoom === 'quarter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onZoomChange('quarter')}
            >
              Quarter
            </Button>
          </div>
        </div>
        
        {/* Date Headers */}
        <div className="flex overflow-x-auto">
          {getDateHeaders()}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="overflow-auto max-h-96">
        <div className="flex">
          {/* Task Names Column */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <div className="p-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tasks
            </div>
            {timelineTasks.map((task, index) => (
              <div 
                key={task.id} 
                className="p-3 border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                onClick={() => onTaskClick(task)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-sm truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {task.priority === 'high' && <Flag className="h-3 w-3 text-red-500" />}
                  {task.priority === 'medium' && <Flag className="h-3 w-3 text-yellow-500" />}
                  {task.priority === 'low' && <Flag className="h-3 w-3 text-green-500" />}
                  {task.assignee && (
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={task.assignee.avatar} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Grid */}
          <div 
            ref={timelineRef}
            className="flex-1 relative"
            style={{ minWidth: getTimelineWidth() }}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0">
              {Array.from({ length: zoom === 'week' ? 7 : zoom === 'month' ? 30 : 90 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-gray-100"
                  style={{ left: i * getDayWidth() }}
                />
              ))}
            </div>

            {/* Task Bars */}
            {timelineTasks.map((task, index) => {
              const position = getTaskPosition(task);
              const isOverdueTask = isOverdue(task);
              
              return (
                <div
                  key={task.id}
                  className="absolute top-0 h-12 flex items-center"
                  style={{ 
                    top: index * 48 + 4,
                    left: position.left,
                    width: position.width
                  }}
                >
                  <div
                    className={`h-8 rounded-md cursor-move flex items-center px-2 text-xs font-medium transition-all hover:shadow-md ${
                      isOverdueTask 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : task.status === 'completed'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : task.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                    onMouseDown={(e) => handleMouseDown(e, task)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                  >
                    <div className="truncate flex-1">{task.title}</div>
                    <div className="ml-2 flex items-center gap-1">
                      {task.priority === 'high' && <Flag className="h-3 w-3" />}
                      {isOverdueTask && <Clock className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Overdue</span>
          </div>
        </div>
      </div>
    </div>
  );
}
