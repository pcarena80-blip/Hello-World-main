import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserSettings, settingsService } from '@/services/settingsService';
import {
  User,
  Bell,
  Shield,
  Settings as SettingsIcon,
  Camera,
  Save,
  Lock,
  Smartphone,
  Key,
  Mail,
  MessageSquare,
  Sun,
  Moon,
  Monitor,
  Globe,
  Clock,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Trash2
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize settings with settingsService
  const [settings, setSettings] = useState<UserSettings>(() => {
    const loadedSettings = settingsService.getSettings();
    return {
      ...loadedSettings,
      profile: {
        ...loadedSettings.profile,
        name: user?.name || loadedSettings.profile.name,
        email: user?.email || loadedSettings.profile.email,
        avatar: user?.avatar || loadedSettings.profile.avatar
      }
    };
  });

  const [isEditing, setIsEditing] = useState({
    profile: false,
    password: false
  });

  const [profileForm, setProfileForm] = useState({
    name: settings.profile.name,
    email: settings.profile.email,
    role: settings.profile.role
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [newApiKeyName, setNewApiKeyName] = useState('');

  // Profile Settings Handlers
  const handleProfileSave = async () => {
    try {
      // Update profile via API call
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id?.toString() || 'default'
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          role: profileForm.role
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      
      // Update local settings state
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: profileForm.name,
          email: profileForm.email,
          role: profileForm.role
        }
      }));
      
      // Update user context if email changed
      if (user && (user.name !== profileForm.name || user.email !== profileForm.email)) {
        const updatedUser = {
          ...user,
          name: profileForm.name,
          email: profileForm.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Note: You might need to call a context update function here
      }
      
      console.log('Profile updated successfully:', result);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated in register.json.",
        variant: "default"
      });
      
      setIsEditing(prev => ({ ...prev, profile: false }));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setProfileForm({
      name: settings.profile.name,
      email: settings.profile.email,
      role: settings.profile.role
    });
    setIsEditing(prev => ({ ...prev, profile: false }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const avatarUrl = await settingsService.uploadAvatar(file);
      setSettings(prev => ({
        ...prev,
        profile: { ...prev.profile, avatar: avatarUrl }
      }));
      
      toast({
        title: "Photo Uploaded",
        description: "Your profile picture has been updated.",
        variant: "default"
      });
      setIsUploadingPhoto(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
      setIsUploadingPhoto(false);
    }
  };

  // Password Change Handler
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    try {
      await settingsService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
        variant: "default"
      });
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsEditing(prev => ({ ...prev, password: false }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
        variant: "destructive"
      });
    }
  };

  // API Key Management
  const generateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newKey = await settingsService.generateApiKey(newApiKeyName);

      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          apiKeys: [...prev.security.apiKeys, newKey]
        }
      }));

      setNewApiKeyName('');
      
      toast({
        title: "API Key Generated",
        description: "Your new API key has been created. Make sure to copy it now as it won't be shown again.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key.",
        variant: "destructive"
      });
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied",
      description: "API key copied to clipboard.",
      variant: "default"
    });
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      await settingsService.revokeApiKey(keyId);
      
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          apiKeys: prev.security.apiKeys.filter(key => key.id !== keyId)
        }
      }));
      
      toast({
        title: "API Key Revoked",
        description: "The API key has been permanently deleted.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke API key.",
        variant: "destructive"
      });
    }
  };

  // Notification Handlers
  const handleConfigureEmailNotifications = () => {
    // TODO: Open email configuration modal or navigate to detailed settings
    toast({
      title: "Email Configuration",
      description: "Email notification preferences have been saved.",
      variant: "default"
    });
  };

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    if (Notification.permission === 'granted') {
      toast({
        title: "Already Enabled",
        description: "Push notifications are already enabled.",
        variant: "default"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // TODO: Register service worker and save push subscription to backend
        toast({
          title: "Push Notifications Enabled",
          description: "You will now receive push notifications.",
          variant: "default"
        });
        
        // Enable push notifications in settings
        updateNotificationSetting('push', 'enabled', true);
        updateNotificationSetting('push', 'browserNotifications', true);
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications have been blocked. You can enable them in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request push notification permission.",
        variant: "destructive"
      });
    }
  };

  // Theme Handler
  const { setTheme, theme: currentTheme } = useTheme();
  
  // Sync theme with settings on mount
  useEffect(() => {
    if (currentTheme && settings.system.theme !== currentTheme) {
      setSettings(prev => ({
        ...prev,
        system: { ...prev.system, theme: currentTheme as 'light' | 'dark' | 'system' }
      }));
    }
  }, [currentTheme]);
  
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    console.log('Theme change requested:', theme);
    console.log('Current theme before change:', currentTheme);
    
    setSettings(prev => ({
      ...prev,
      system: { ...prev.system, theme }
    }));
    
    // Apply theme change immediately
    setTheme(theme);
    
    // Debug: Check if theme is applied
    setTimeout(() => {
      console.log('Theme after setTheme:', document.documentElement.className);
      console.log('CSS background variable:', getComputedStyle(document.documentElement).getPropertyValue('--background'));
    }, 100);
    
    // Save to settings service
    settingsService.updateSystem({ theme, language: settings.system.language, timezone: settings.system.timezone })
      .then(() => {
        toast({
          title: "Theme Updated",
          description: `Theme changed to ${theme} mode.`,
          variant: "default"
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to save theme preference.",
          variant: "destructive"
        });
        console.error('Failed to save theme:', error);
      });
  };

  // Settings Save Functions
  const saveProfileSettings = async () => {
    try {
      await settingsService.updateProfile(settings.profile);
      toast({
        title: "Profile Updated",
        description: "Your profile settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile settings.",
        variant: "destructive"
      });
    }
  };

  const saveNotificationSettings = async () => {
    try {
      await settingsService.updateNotifications(settings.notifications);
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive"
      });
    }
  };

  const saveSecuritySettings = async () => {
    try {
      await settingsService.updateSecurity(settings.security);
      toast({
        title: "Security Updated",
        description: "Your security settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security settings.",
        variant: "destructive"
      });
    }
  };

  const saveSystemSettings = async () => {
    try {
      await settingsService.updateSystem(settings.system);
      toast({
        title: "System Updated",
        description: "Your system preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update system settings.",
        variant: "destructive"
      });
    }
  };

  // Notification Settings Handler
  const updateNotificationSetting = (category: keyof UserSettings['notifications'], setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [category]: {
          ...prev.notifications[category],
          [setting]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Photo */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={settings.profile.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
                    {settings.profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-medium">{settings.profile.name}</h3>
                <p className="text-sm text-muted-foreground">{settings.profile.role}</p>
                <Badge variant="secondary" className="mt-1">
                  {user?.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={isEditing.profile ? profileForm.name : settings.profile.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing.profile}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={isEditing.profile ? profileForm.email : settings.profile.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing.profile}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={isEditing.profile ? profileForm.role : settings.profile.role}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, role: e.target.value }))}
                  disabled={!isEditing.profile}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Profile Actions */}
            <div className="flex space-x-2">
              {!isEditing.profile ? (
                <Button
                  onClick={() => {
                    setProfileForm({
                      name: settings.profile.name,
                      email: settings.profile.email,
                      role: settings.profile.role
                    });
                    setIsEditing(prev => ({ ...prev, profile: true }));
                  }}
                  variant="outline"
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button onClick={handleProfileSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Bell className="w-5 h-5 mr-2 text-green-600" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Email Notifications</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfigureEmailNotifications()}
                    disabled={!settings.notifications.email.enabled}
                  >
                    Configure
                  </Button>
                  <Switch
                    checked={settings.notifications.email.enabled}
                    onCheckedChange={(checked) => updateNotificationSetting('email', 'enabled', checked)}
                  />
                </div>
              </div>
              {settings.notifications.email.enabled && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekly Updates</span>
                    <Switch
                      checked={settings.notifications.email.weeklyUpdates}
                      onCheckedChange={(checked) => updateNotificationSetting('email', 'weeklyUpdates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sales Alerts</span>
                    <Switch
                      checked={settings.notifications.email.salesAlerts}
                      onCheckedChange={(checked) => updateNotificationSetting('email', 'salesAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Task Reminders</span>
                    <Switch
                      checked={settings.notifications.email.taskReminders}
                      onCheckedChange={(checked) => updateNotificationSetting('email', 'taskReminders', checked)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Push Notifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Push Notifications</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequestPushPermission()}
                    disabled={!('Notification' in window) || Notification.permission === 'denied'}
                  >
                    {Notification.permission === 'granted' ? 'Enabled' : 'Enable'}
                  </Button>
                  <Switch
                    checked={settings.notifications.push.enabled}
                    onCheckedChange={(checked) => updateNotificationSetting('push', 'enabled', checked)}
                  />
                </div>
              </div>
              {settings.notifications.push.enabled && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Browser Notifications</span>
                    <Switch
                      checked={settings.notifications.push.browserNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('push', 'browserNotifications', checked)}
                    />
                  </div>
                  {Notification.permission !== 'granted' && (
                    <div className="text-xs text-muted-foreground">
                      Browser permission required for push notifications
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Chat Alerts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Chat Alerts</span>
                </div>
                <Switch
                  checked={settings.notifications.chat.enabled}
                  onCheckedChange={(checked) => updateNotificationSetting('chat', 'enabled', checked)}
                />
              </div>
              {settings.notifications.chat.enabled && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Messages</span>
                    <Switch
                      checked={settings.notifications.chat.newMessages}
                      onCheckedChange={(checked) => updateNotificationSetting('chat', 'newMessages', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mentions</span>
                    <Switch
                      checked={settings.notifications.chat.mentions}
                      onCheckedChange={(checked) => updateNotificationSetting('chat', 'mentions', checked)}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Change Password */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  <span className="font-medium">Change Password</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(prev => ({ ...prev, password: !prev.password }))}
                >
                  {isEditing.password ? 'Cancel' : 'Change'}
                </Button>
              </div>
              
              {isEditing.password && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="mt-1 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-1 h-8 w-8 px-0"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="mt-1 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-1 h-8 w-8 px-0"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="mt-1 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-1 h-8 w-8 px-0"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handlePasswordChange} className="w-full">
                    Update Password
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-green-600" />
                <div>
                  <span className="font-medium">Two-Factor Authentication</span>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
              </div>
              <Switch
                checked={settings.security.twoFactorEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, twoFactorEnabled: checked }
                }))}
              />
            </div>

            <Separator />

            {/* API Keys */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium">API Keys</span>
                </div>
              </div>
              
              {/* Generate New API Key */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="API key name (e.g., Mobile App)"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                  />
                  <Button onClick={generateApiKey}>
                    Generate
                  </Button>
                </div>
                
                {/* Existing API Keys */}
                {settings.security.apiKeys.length > 0 && (
                  <div className="space-y-2">
                    {settings.security.apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{apiKey.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {apiKey.key.substring(0, 8)}...{apiKey.key.substring(apiKey.key.length - 4)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyApiKey(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeApiKey(apiKey.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2 text-gray-600" />
              System Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4 text-yellow-600" />
                <div>
                  <span className="font-medium">Theme</span>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                </div>
              </div>
              <Select value={currentTheme || settings.system.theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center space-x-2">
                      <Sun className="w-4 h-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center space-x-2">
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4" />
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="font-medium">Language</span>
                  <p className="text-sm text-muted-foreground">Select your preferred language</p>
                </div>
              </div>
              <Select value={settings.system.language} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, system: { ...prev.system, language: value } }))
              }>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                  <SelectItem value="fr-FR">Français</SelectItem>
                  <SelectItem value="de-DE">Deutsch</SelectItem>
                  <SelectItem value="zh-CN">中文</SelectItem>
                  <SelectItem value="ja-JP">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Time Zone */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <div>
                  <span className="font-medium">Time Zone</span>
                  <p className="text-sm text-muted-foreground">Set your local time zone</p>
                </div>
              </div>
              <Select value={settings.system.timezone} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, system: { ...prev.system, timezone: value } }))
              }>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC-12">UTC-12 (Baker Island)</SelectItem>
                  <SelectItem value="UTC-11">UTC-11 (Hawaii)</SelectItem>
                  <SelectItem value="UTC-10">UTC-10 (Alaska)</SelectItem>
                  <SelectItem value="UTC-9">UTC-9 (Pacific)</SelectItem>
                  <SelectItem value="UTC-8">UTC-8 (Pacific)</SelectItem>
                  <SelectItem value="UTC-7">UTC-7 (Mountain)</SelectItem>
                  <SelectItem value="UTC-6">UTC-6 (Central)</SelectItem>
                  <SelectItem value="UTC-5">UTC-5 (Eastern)</SelectItem>
                  <SelectItem value="UTC-4">UTC-4 (Atlantic)</SelectItem>
                  <SelectItem value="UTC-3">UTC-3 (Argentina)</SelectItem>
                  <SelectItem value="UTC-2">UTC-2 (Mid-Atlantic)</SelectItem>
                  <SelectItem value="UTC-1">UTC-1 (Azores)</SelectItem>
                  <SelectItem value="UTC+0">UTC+0 (London)</SelectItem>
                  <SelectItem value="UTC+1">UTC+1 (Berlin)</SelectItem>
                  <SelectItem value="UTC+2">UTC+2 (Cairo)</SelectItem>
                  <SelectItem value="UTC+3">UTC+3 (Moscow)</SelectItem>
                  <SelectItem value="UTC+4">UTC+4 (Dubai)</SelectItem>
                  <SelectItem value="UTC+5">UTC+5 (Karachi)</SelectItem>
                  <SelectItem value="UTC+6">UTC+6 (Dhaka)</SelectItem>
                  <SelectItem value="UTC+7">UTC+7 (Bangkok)</SelectItem>
                  <SelectItem value="UTC+8">UTC+8 (Beijing)</SelectItem>
                  <SelectItem value="UTC+9">UTC+9 (Tokyo)</SelectItem>
                  <SelectItem value="UTC+10">UTC+10 (Sydney)</SelectItem>
                  <SelectItem value="UTC+11">UTC+11 (Solomon Islands)</SelectItem>
                  <SelectItem value="UTC+12">UTC+12 (Fiji)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;