import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { 
  Search,
  Bell,
  Plus,
  Home,
  CheckSquare,
  FolderKanban,
  Calendar,
  Clock,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Star,
  Zap,
  Brain,
  Target,
  MessageSquare,
  FileText,
  Workflow,
  Globe,
  Lock,
  Eye,
  Palette
} from 'lucide-react';

interface AsanaLayoutProps {
  children: React.ReactNode;
  currentSection?: string;
  onSectionChange?: (section: string) => void;
  // Pass filter, sort, and group state to children
  filters?: {
    status: string;
    priority: string;
    assignee: string;
    dateRange: string;
  };
  sortBy?: string;
  groupBy?: string;
  viewMode?: 'list' | 'grid';
}

export function AsanaLayout({ 
  children, 
  currentSection = 'home', 
  onSectionChange,
  filters: externalFilters,
  sortBy: externalSortBy,
  groupBy: externalGroupBy,
  viewMode: externalViewMode
}: AsanaLayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentProjects, setRecentProjects] = useState<Array<{
    id: string;
    name: string;
    color: string;
    type: string;
  }>>([]);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  
  // Load pending invitations
  const loadPendingInvitations = async () => {
    if (user?.id) {
      try {
        const response = await fetch(`/api/invitations/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setPendingInvitations(data.invitations?.length || 0);
        }
      } catch (error) {
        console.error('Failed to load pending invitations:', error);
      }
    }
  };

  useEffect(() => {
    loadPendingInvitations();
  }, [user?.id]);

  // Refresh invitations when navigating to organizations
  useEffect(() => {
    if (currentSection === 'organizations') {
      loadPendingInvitations();
    }
  }, [currentSection]);

  const sidebarItems = [
    { id: 'home', name: 'Home', icon: Home, badge: null },
    { id: 'inbox', name: 'Inbox', icon: Bell, badge: '2' },
    { id: 'projects', name: 'Projects', icon: FolderKanban, badge: null },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare, badge: null },
    { id: 'messages', name: 'Messages', icon: MessageSquare, badge: '1' },
    { id: 'files', name: 'Files', icon: FileText, badge: null },
    { id: 'workflow', name: 'My WorkSpace', icon: Workflow, badge: null },
    
    { id: 'organizations', name: 'Organizations', icon: Users, badge: pendingInvitations > 0 ? pendingInvitations.toString() : null },
  ];

  // Load real project data
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const projects = await response.json();
          const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FBBF24', '#A78BFA', '#60A5FA', '#34D399'];
          
          const recentProjectsData = projects.slice(0, 4).map((project: any, index: number) => ({
            id: project.id,
            name: project.title,
            color: colors[index % colors.length],
            type: 'project'
          }));
          
          setRecentProjects(recentProjectsData);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        // Fallback to mock data if API fails
        setRecentProjects([
          { id: '1', name: 'Test Project', color: '#FF6B6B', type: 'project' },
          { id: '2', name: 'cPokémon', color: '#4ECDC4', type: 'project' },
          { id: '3', name: 'hello world', color: '#45B7D1', type: 'project' },
        ]);
      }
    };

    loadProjects();
  }, []);


  return (
    <div className="responsive-layout bg-gray-50 flex h-screen">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`responsive-sidebar ${
        sidebarOpen ? 'w-64' : 'w-16'
      } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col fixed lg:relative z-50 h-screen ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-lg text-gray-900">Asana</h1>
                  <p className="text-xs text-gray-500">Work management</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={sidebarOpen ? "Search" : ""}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange?.(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentSection === item.id 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Recent Projects */}
          {sidebarOpen && (
            <div className="p-2 border-t border-gray-200">
              <div className="flex items-center justify-between px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Recent
                </h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={(event) => {
                      console.log('Opening project:', project.name, 'ID:', project.id);
                      // Show a brief visual feedback
                      const button = event.currentTarget;
                      button.style.transform = 'scale(0.98)';
                      setTimeout(() => {
                        button.style.transform = 'scale(1)';
                      }, 150);
                      onSectionChange?.('projects');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 cursor-pointer group"
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="flex-1 text-left truncate group-hover:font-medium">{project.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400 group-hover:text-blue-500">{project.type}</span>
                      <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/user.jpg" />
                  <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Globe className="h-4 w-4 mr-2" />
                Switch workspace
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Lock className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="responsive-main flex flex-col h-screen flex-1">
        {/* Top Header - Removed */}

        {/* Content Area */}
        <div className="responsive-dashboard-main overflow-hidden h-full flex-1">
          {/* Mobile Header */}
          <div className="lg:hidden responsive-header p-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Asana</h1>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
          <div className="responsive-content">
            {children}
          </div>
        </div>
      </div>

    </div>
  );
}
