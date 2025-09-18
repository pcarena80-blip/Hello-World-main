import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, User, LogOut, Menu, Building2, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  onMobileMenuToggle?: () => void;
  onOrganizationClick?: () => void;
}

export const TopBar = ({ onMobileMenuToggle, onOrganizationClick }: TopBarProps) => {
  const { user, logout } = useAuth();
  const { currentOrganization, organizations, setCurrentOrganization } = useOrganization();
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });

  const handleLogout = async () => {
    console.log('TopBar: Logout button clicked');
    console.log('TopBar: Current user before logout:', user);
    
    await logout();
    
    console.log('TopBar: Logout completed, navigating to login');
    console.log('TopBar: Current user after logout:', user);
    
    // Force navigation to login page and clear any cached routes
    navigate('/login', { replace: true });
    
    // Force a page refresh to ensure clean state
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  return (
    <div className="flex items-center justify-between p-3 lg:p-6 border-b border-border bg-background">
      {/* Left Section - Mobile Menu, Logo & Search */}
      <div className="flex items-center space-x-3 lg:space-x-6">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">*</span>
          </div>
          <h1 className="text-lg lg:text-xl font-bold">Silver Ant Marketing</h1>
        </div>
        
        <div className="relative hidden md:block w-64 lg:w-96 md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Start searching here..." 
            className="pl-10 bg-muted border-border focus:bg-background"
          />
        </div>

        {/* Organization Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {currentOrganization ? currentOrganization.name : 'Select Organization'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOrganizationClick}>
              <Building2 className="h-4 w-4 mr-2" />
              Manage Organizations
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem 
                key={org.id}
                onClick={() => {
                  console.log('🔄 TopBar: User clicked on organization:', org.name, 'ID:', org.id);
                  console.log('🔄 TopBar: Previous organization was:', currentOrganization?.name, 'ID:', currentOrganization?.id);
                  setCurrentOrganization(org);
                  console.log('🔄 TopBar: Organization set to:', org.name, 'ID:', org.id);
                }}
                className={currentOrganization?.id === org.id ? 'bg-blue-50' : ''}
              >
                <Building2 className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>{org.name}</span>
                  <span className="text-xs text-gray-500">{org.userRole}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOrganizationClick}>
              <Building2 className="h-4 w-4 mr-2" />
              Create New Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right Section - Notifications, Date, Profile */}
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
        </Button>
        
        {/* Current Date - Hidden on small screens */}
        <div className="hidden lg:block text-sm text-muted-foreground">
          {currentDate}
        </div>
        
        {/* User Profile */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          <Avatar className="w-8 h-8 lg:w-10 lg:h-10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xs lg:text-sm">
              {user ? user.name.substring(0, 2).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium">{user ? user.name : "Guest"}</p>
            <p className="text-xs text-muted-foreground">{user ? user.email : "Not logged in"}</p>
          </div>
          
          {/* Logout Button */}
          {user && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};