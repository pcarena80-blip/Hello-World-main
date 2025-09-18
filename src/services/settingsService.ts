import { nanoid } from "nanoid";

export interface UserSettings {
  profile: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  notifications: {
    email: {
      enabled: boolean;
      weeklyUpdates: boolean;
      salesAlerts: boolean;
      taskReminders: boolean;
    };
    push: {
      enabled: boolean;
      browserNotifications: boolean;
    };
    chat: {
      enabled: boolean;
      newMessages: boolean;
      mentions: boolean;
    };
  };
  security: {
    twoFactorEnabled: boolean;
    apiKeys: Array<{
      id: string;
      name: string;
      key: string;
      createdAt: string;
      lastUsed?: string;
    }>;
  };
  system: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

type SettingsSubscriber = (settings: UserSettings) => void;

const STORAGE_KEY = "user_settings_v1";
const API_BASE_URL = "/api";

class SettingsService {
  private settings: UserSettings;
  private subscribers: Set<SettingsSubscriber> = new Set();

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadFromStorage();
  }

  private getDefaultSettings(): UserSettings {
    return {
      profile: {
        name: "",
        email: "",
        role: "user",
        avatar: undefined
      },
      notifications: {
        email: {
          enabled: true,
          weeklyUpdates: true,
          salesAlerts: true,
          taskReminders: true
        },
        push: {
          enabled: false,
          browserNotifications: false
        },
        chat: {
          enabled: true,
          newMessages: true,
          mentions: true
        }
      },
      security: {
        twoFactorEnabled: false,
        apiKeys: []
      },
      system: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC+0'
      }
    };
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserSettings;
        this.settings = { ...this.getDefaultSettings(), ...parsed };
      }
    } catch (error) {
      console.error("Failed to load settings from storage:", error);
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error("Failed to persist settings:", error);
    }
  }

  subscribe(cb: SettingsSubscriber): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notify() {
    this.subscribers.forEach(cb => cb(this.settings));
  }

  getSettings(): UserSettings {
    return { ...this.settings };
  }

  async updateProfile(profile: Partial<UserSettings['profile']>): Promise<void> {
    try {
      // For now, just update locally without API call
      this.settings.profile = { ...this.settings.profile, ...profile };
      this.persist();
      this.notify();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async updateNotifications(notifications: Partial<UserSettings['notifications']>): Promise<void> {
    try {
      // For now, just update locally without API call
      this.settings.notifications = { ...this.settings.notifications, ...notifications };
      this.persist();
      this.notify();
    } catch (error) {
      console.error('Error updating notifications:', error);
      throw error;
    }
  }

  async updateSecurity(security: Partial<UserSettings['security']>): Promise<void> {
    try {
      // For now, just update locally without API call
      this.settings.security = { ...this.settings.security, ...security };
      this.persist();
      this.notify();
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  }

  async updateSystem(system: Partial<UserSettings['system']>): Promise<void> {
    try {
      // For now, just update locally without API call
      this.settings.system = { ...this.settings.system, ...system };
      this.persist();
      this.notify();
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  async generateApiKey(name: string): Promise<ApiKey> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error('Failed to generate API key');
      }

      const apiKey = await response.json();
      this.settings.security.apiKeys.push(apiKey);
      this.persist();
      this.notify();
      
      return apiKey;
    } catch (error) {
      console.error('Error generating API key:', error);
      throw error;
    }
  }

  async revokeApiKey(keyId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/api-keys/${keyId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      this.settings.security.apiKeys = this.settings.security.apiKeys.filter(key => key.id !== keyId);
      this.persist();
      this.notify();
    } catch (error) {
      console.error('Error revoking API key:', error);
      throw error;
    }
  }

  async uploadAvatar(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_BASE_URL}/settings/avatar`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const { avatarUrl } = await response.json();
      this.settings.profile.avatar = avatarUrl;
      this.persist();
      this.notify();
      
      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  // Sync settings from server
  async syncFromServer(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings from server');
      }

      const serverSettings = await response.json();
      this.settings = { ...this.getDefaultSettings(), ...serverSettings };
      this.persist();
      this.notify();
    } catch (error) {
      console.error('Error syncing settings from server:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();