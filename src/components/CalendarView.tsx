import React, { useState, useRef, useEffect } from 'react';
import { Task } from '@/types/tasks';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Flag, 
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal
} from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskClick: (task: Task) => void;
  onCreateTask: (date: Date) => void;
  view: 'month' | 'week';
  onViewChange: (view: 'month' | 'week') => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

interface CalendarTask extends Task {
  dueDate: Date;
  isOverdue: boolean;
}

export function CalendarView({ 
  tasks, 
  onTaskUpdate, 
  onTaskClick, 
  onCreateTask,
  view, 
  onViewChange, 
  currentDate, 
  onDateChange 
}: CalendarViewProps) {
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Convert tasks to calendar format
  const calendarTasks: CalendarTask[] = tasks.map(task => ({
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
    isOverdue: task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'completed' : false
  }));

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (view === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const days = [];
      for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
      }
      return days;
    } else {
      // Week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        days.push(date);
      }
      return days;
    }
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return calendarTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in current month (for month view)
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Navigate calendar
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (view === 'month') {
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    } else {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    }
    
    onDateChange(newDate);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, task: CalendarTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    
    if (draggedTask) {
      const updatedTask = {
        ...draggedTask,
        dueDate: date.toISOString()
      };
      
      onTaskUpdate(updatedTask);
      setDraggedTask(null);
      setDragOverDate(null);
    }
  };

  // Handle create task
  const handleCreateTask = (date: Date) => {
    onCreateTask(date);
  };

  const days = getCalendarDays();

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Calendar Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Calendar View</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCalendar('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateCalendar('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {view === 'month' 
                ? currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })
                : `${days[0].toLocaleDateString()} - ${days[6].toLocaleDateString()}`
              }
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange('week')}
            >
              Week
            </Button>
          </div>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div ref={calendarRef} className="p-4">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((date, index) => {
            const tasksForDate = getTasksForDate(date);
            const isTodayDate = isToday(date);
            const isCurrentMonthDate = view === 'month' ? isCurrentMonth(date) : true;
            const isDragOver = dragOverDate && dragOverDate.toDateString() === date.toDateString();
            
            return (
              <div
                key={index}
                className={`bg-white min-h-24 p-2 relative ${
                  !isCurrentMonthDate ? 'text-gray-400' : ''
                } ${
                  isDragOver ? 'bg-blue-50 border-2 border-blue-300' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, date)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, date)}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isTodayDate ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                  }`}>
                    {date.getDate()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                    onClick={() => handleCreateTask(date)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Tasks */}
                <div className="space-y-1">
                  {tasksForDate.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className={`p-1 rounded text-xs cursor-move hover:shadow-sm transition-shadow ${
                        task.isOverdue 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : task.status === 'completed'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : task.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {task.priority === 'high' && <Flag className="h-2 w-2 text-red-500" />}
                        {task.priority === 'medium' && <Flag className="h-2 w-2 text-yellow-500" />}
                        {task.priority === 'low' && <Flag className="h-2 w-2 text-green-500" />}
                        {task.isOverdue && <Clock className="h-2 w-2 text-red-500" />}
                      </div>
                      <div className="truncate font-medium">{task.title}</div>
                      {task.assignee && (
                        <div className="flex items-center gap-1 mt-1">
                          <Avatar className="h-3 w-3">
                            <AvatarImage src={task.assignee.avatar} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate">{task.assignee.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {tasksForDate.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{tasksForDate.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
