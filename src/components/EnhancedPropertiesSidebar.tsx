import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  X,
  Edit,
  Save,
  Trash2,
  Calendar,
  User,
  Flag,
  Clock,
  MessageSquare,
  Paperclip,
  Image,
  Video,
  File,
  Plus,
  CheckSquare,
  Star,
  Tag,
  Link2,
  Copy,
  Share,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Upload,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Task, Project } from '@/types/tasks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EnhancedPropertiesSidebarProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
  projects?: Project[];
  users?: any[];
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface Comment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  url: string;
  size?: number;
  uploadedBy: {
    id: string;
    name: string;
  };
  uploadedAt: string;
}

export function EnhancedPropertiesSidebar({ 
  task, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete,
  projects = [],
  users = []
}: EnhancedPropertiesSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    subtasks: true,
    comments: true,
    attachments: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || project?.projectName || 'Unknown Project';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown User';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'text-gray-600 bg-gray-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'review': return 'text-yellow-600 bg-yellow-100';
      case 'done': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleUpdate = (updates: Partial<Task>) => {
    onUpdate({ ...task, ...updates });
    setEditingField(null);
  };

  const handleSubtaskAdd = () => {
    if (newSubtask.trim()) {
      const subtask: Subtask = {
        id: `subtask-${Date.now()}`,
        title: newSubtask.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      setSubtasks(prev => [...prev, subtask]);
      setNewSubtask('');
    }
  };

  const handleSubtaskToggle = (subtaskId: string) => {
    setSubtasks(prev => prev.map(subtask => 
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    ));
  };

  const handleSubtaskDelete = (subtaskId: string) => {
    setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId));
  };

  const handleCommentAdd = () => {
    if (newComment.trim() && user) {
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        text: newComment.trim(),
        author: {
          id: user.id,
          name: user.name || 'Unknown User'
        },
        createdAt: new Date().toISOString()
      };
      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const attachment: Attachment = {
          id: `attachment-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'file',
          url: URL.createObjectURL(file),
          size: file.size,
          uploadedBy: {
            id: user?.id || 'unknown',
            name: user?.name || 'Unknown User'
          },
          uploadedAt: new Date().toISOString()
        };
        setAttachments(prev => [...prev, attachment]);
      });
      toast({ title: 'Files uploaded successfully' });
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-gray-900">Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('details')}
              >
                {expandedSections.details ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
            
            {expandedSections.details && (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                  {editingField === 'title' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={task.title}
                        onChange={(e) => handleUpdate({ title: e.target.value })}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => setEditingField(null)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('title')}
                      className="text-left text-gray-900 hover:text-blue-600 transition-colors w-full"
                    >
                      {task.title}
                    </button>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                  {editingField === 'description' ? (
                    <div className="space-y-2">
                      <Textarea
                        value={task.description || ''}
                        onChange={(e) => handleUpdate({ description: e.target.value })}
                        rows={4}
                        className="w-full"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setEditingField(null)}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingField(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('description')}
                      className="text-left text-gray-600 hover:text-blue-600 transition-colors w-full min-h-[60px] p-2 border border-gray-200 rounded-md hover:border-gray-300"
                    >
                      {task.description || 'Add description...'}
                    </button>
                  )}
                </div>

                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                    {editingField === 'status' ? (
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleUpdate({ status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        onClick={() => setEditingField('status')}
                        className="w-full"
                      >
                        <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ')}
                        </Badge>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                    {editingField === 'priority' ? (
                      <Select
                        value={task.priority}
                        onValueChange={(value) => handleUpdate({ priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        onClick={() => setEditingField('priority')}
                        className="w-full"
                      >
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </button>
                    )}
                  </div>
                </div>

                {/* Assignee & Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Assignee</label>
                    {editingField === 'assignee' ? (
                      <Select
                        value={task.assignedTo?.id || ''}
                        onValueChange={(value) => {
                          const assignee = users.find(u => u.id === value);
                          handleUpdate({ assignedTo: assignee });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        onClick={() => setEditingField('assignee')}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors w-full"
                      >
                        {task.assignedTo ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {task.assignedTo.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{task.assignedTo.name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</label>
                    {editingField === 'dueDate' ? (
                      <Input
                        type="date"
                        value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleUpdate({ dueDate: e.target.value })}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingField('dueDate')}
                        className="text-sm text-gray-700 hover:text-blue-600 transition-colors w-full text-left"
                      >
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Project */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Project</label>
                  <span className="text-sm text-gray-600">
                    {getProjectName(task.projectId)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-gray-900">Subtasks</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('subtasks')}
              >
                {expandedSections.subtasks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
            
            {expandedSections.subtasks && (
              <div className="space-y-3">
                {/* Add Subtask */}
                <div className="flex items-center gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add subtask..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubtaskAdd();
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleSubtaskAdd}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Subtasks List */}
                <div className="space-y-2">
                  {subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => handleSubtaskToggle(subtask.id)}
                        className="rounded border-gray-300"
                      />
                      <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {subtask.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSubtaskDelete(subtask.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-gray-900">Comments</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('comments')}
              >
                {expandedSections.comments ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
            
            {expandedSections.comments && (
              <div className="space-y-3">
                {/* Add Comment */}
                <div className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewComment('')}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCommentAdd}
                      disabled={!newComment.trim()}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Comment
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {comment.author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.author.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-gray-900">Attachments</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('attachments')}
              >
                {expandedSections.attachments ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
            
            {expandedSections.attachments && (
              <div className="space-y-3">
                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Attachments List */}
                <div className="space-y-2">
                  {attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded">
                      <div className="flex-shrink-0">
                        {attachment.type === 'image' && <Image className="h-5 w-5 text-blue-600" />}
                        {attachment.type === 'video' && <Video className="h-5 w-5 text-red-600" />}
                        {attachment.type === 'file' && <File className="h-5 w-5 text-gray-600" />}
                        {attachment.type === 'link' && <Link2 className="h-5 w-5 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attachment.size && formatFileSize(attachment.size)} • {attachment.uploadedBy.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.url, '_blank')}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(attachment.url);
                            toast({ title: 'Link copied to clipboard' });
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to delete this task?')) {
                  onDelete(task.id);
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: 'Task link copied to clipboard' });
              }}
            >
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
