import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    console.log('=== AUTHCONTEXT INIT START ===');
    console.log('AuthContext: Checking for stored user data...');
    
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('AuthContext: Found stored user:', userData);
        
        // Validate user data structure
        if (userData && userData.id && userData.name && userData.email && userData.role) {
          // Check if the stored user is still valid by calling the backend
          const checkUserValidity = async () => {
            try {
              const response = await fetch(`/api/user?email=${encodeURIComponent(userData.email)}`);
              if (response.ok) {
                setUser(userData);
                console.log('AuthContext: Restored user from storage');
              } else {
                console.log('AuthContext: Stored user no longer valid, clearing...');
                localStorage.removeItem('user');
                setUser(null);
              }
            } catch (error) {
              console.error('AuthContext: Error checking user validity:', error);
              localStorage.removeItem('user');
              setUser(null);
            }
          };
          
          checkUserValidity();
        } else {
          console.error('Invalid stored user data, clearing...');
          localStorage.removeItem('user');
        }
      } else {
        console.log('AuthContext: No stored user data found');
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
      console.log('=== AUTHCONTEXT INIT END ===');
    }
  }, []);

  const login = (userData: User) => {
    console.log('=== AUTHCONTEXT LOGIN START ===');
    console.log('AuthContext: login called with:', userData);
    console.log('AuthContext: Current user state before:', user);
    console.log('AuthContext: Current isAuthenticated before:', !!user);
    
    // Validate user data
    if (!userData || !userData.id || !userData.name || !userData.email) {
      console.error('Invalid user data provided to login:', userData);
      throw new Error('Invalid user data');
    }

    // Check if role is missing (legacy user) and provide helpful error
    if (!userData.role) {
      console.error('User missing role field:', userData);
      throw new Error('Your account is missing role information. Please register a new account with your preferred role (Admin or User).');
    }
    
    setUser(userData);
    console.log('AuthContext: setUser() called with:', userData);
    
    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('AuthContext: user stored in localStorage');
    
    console.log('AuthContext: State should now be updated');
    console.log('=== AUTHCONTEXT LOGIN END ===');
  };

  const logout = async () => {
    console.log('=== AUTHCONTEXT LOGOUT START ===');
    console.log('AuthContext: Current user before logout:', user);
    console.log('AuthContext: Current isAuthenticated before logout:', !!user);
    
    try {
      if (user) {
        console.log('AuthContext: Calling logout API for user:', user.email);
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email }),
        });

        console.log('AuthContext: Logout API response status:', response.status);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log('AuthContext: Logout API call successful:', responseData);
        } else {
          console.warn('AuthContext: Logout API call failed, but clearing local data');
        }
      } else {
        console.log('AuthContext: No user to logout, clearing local data only');
      }
    } catch (error) {
      console.error('AuthContext: Logout API error:', error);
    }

    // Always clear user data locally
    console.log('AuthContext: Clearing user data locally...');
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    // Force state update to ensure isAuthenticated becomes false
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 50);
    
    console.log('AuthContext: User data cleared locally');
    console.log('AuthContext: Current user after logout:', null);
    console.log('AuthContext: Current isAuthenticated after logout:', false);
    console.log('=== AUTHCONTEXT LOGOUT END ===');
    
    // Let components handle navigation after logout
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user && !isLoading,
    isLoading,
    isAdmin: !!user && user.role === 'admin',
    isUser: !!user && user.role === 'user',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
