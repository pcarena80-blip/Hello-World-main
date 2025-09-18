import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Users,
  Calendar,
  BookOpen,
  Settings,
  MoreHorizontal,
  FolderKanban,
  CheckSquare,
  FileText,
  Activity,
  Search,
  Filter,
  ArrowRight,
  Mail,
  UserPlus,
  Save,
  X
} from 'lucide-react';

interface MyWorkspaceProps {
  showHeader?: boolean;
}

export function MyWorkspace({ showHeader = true }: MyWorkspaceProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState('Click to add team description...');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const workspace = {
    id: '1',
    name: currentUser?.name ? `${currentUser.name}'s Workspace` : 'My Workspace',
    description: description,
    initials: currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'MW',
    memberCount: 8,
    projectCount: projects.length,
    taskCount: tasks.length,
    coverColor: 'bg-gradient-to-r from-blue-500 to-purple-600'
  };

  // Fetch tasks and projects data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch tasks
        const tasksResponse = await fetch('/api/tasks');
        const tasksData = await tasksResponse.json();
        setTasks(tasksData || []);

        // Fetch projects
        const projectsResponse = await fetch('/api/projects');
        const projectsData = await projectsResponse.json();
        setProjects(projectsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setTasks([]);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'members', name: 'Members', icon: Users },
    { id: 'all-work', name: 'All work', icon: FolderKanban },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'knowledge', name: 'Knowledge', icon: BookOpen }
  ];


  return (
    <div className="w-full min-h-screen bg-white">
      {/* Top App Bar */}
      {showHeader && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Workspace Avatar + Title */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white font-medium text-sm">
                {workspace.initials}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-semibold text-gray-900">{workspace.name}</h1>
          </div>

          {/* Center: Tab Navigation */}
          <div className="flex items-center space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Right: Invite Button + User Menu */}
          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Settings className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-600 text-white font-medium text-sm">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        </div>
      )}

      {/* Cover/Hero Band */}
      <div className={`h-32 ${workspace.coverColor} relative`}>
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Identity Block */}
      <div className="px-6 py-6 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Large Avatar */}
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-blue-600 text-white font-bold text-2xl">
                {workspace.initials}
              </AvatarFallback>
            </Avatar>
            
            {/* Name + Description */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{workspace.name}</h2>
              <div className="flex items-center gap-2">
                {isEditingDescription ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-white border-gray-300 text-gray-900"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => setIsEditingDescription(false)} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => setIsEditingDescription(false)} className="bg-gray-600 hover:bg-gray-700">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-gray-500 hover:text-gray-700 text-left"
                  >
                    {description}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action: Create Work */}
          <div className="relative">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
              onClick={() => setShowCreateMenu(!showCreateMenu)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create work
            </Button>
            
            {showCreateMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <div className="py-2">
                  {[
                    { name: 'New Project', icon: FolderKanban },
                    { name: 'New Task', icon: CheckSquare },
                    { name: 'New Doc', icon: FileText },
                    { name: 'Import', icon: ArrowRight }
                  ].map((item) => (
                    <button
                      key={item.name}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body Area - Tab Content */}
      <div className="px-6 pb-8 bg-gray-50">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Tasks Feed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                Recent Tasks
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks yet. Create your first task to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {task.assignedTo && (
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {task.assignedTo.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.estimatedHours && (
                              <span className="text-blue-600 font-medium">{task.estimatedHours}h</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.priority && (
                            <Badge className={`text-xs ${
                              task.priority.name === 'High' ? 'bg-red-100 text-red-800' :
                              task.priority.name === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority.name}
                            </Badge>
                          )}
                          {task.status && (
                            <Badge className={`text-xs ${
                              task.status.name === 'Completed' ? 'bg-green-100 text-green-800' :
                              task.status.name === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              task.status.name === 'Upcoming' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {task.status.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Projects Feed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-green-600" />
                Active Projects
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No projects yet. Create your first project to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                              project.status === 'active' ? 'bg-green-500' :
                              project.status === 'pending' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}></div>
                            <h4 className="font-medium text-gray-900">{project.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  project.status === 'active' ? 'bg-green-500' :
                                  project.status === 'pending' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{project.assignedMembers?.length || 0} members</span>
                              <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`text-xs ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No team members yet. Invite people to join your workspace!</p>
            </div>
          </div>
        )}

        {activeTab === 'all-work' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Work Items</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading work items...</p>
                </div>
              ) : (tasks.length === 0 && projects.length === 0) ? (
                <div className="text-center py-8">
                  <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No work items yet. Create your first project or task to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Show recent tasks */}
                  {tasks.slice(0, 3).map((task) => (
                    <div key={`task-${task.id}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${
                        task.status?.name === 'Completed' ? 'bg-green-100 text-green-800' :
                        task.status?.name === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status?.name || 'Unknown'}
                      </Badge>
                    </div>
                  ))}
                  
                  {/* Show recent projects */}
                  {projects.slice(0, 3).map((project) => (
                    <div key={`project-${project.id}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <FolderKanban className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">{project.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{project.description}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${
                        project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar</h3>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Calendar view coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Base</h3>
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Knowledge base coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Invite Team Members</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <Input 
                  placeholder="Enter email address" 
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700">
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
