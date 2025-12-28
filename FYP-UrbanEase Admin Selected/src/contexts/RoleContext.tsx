import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'superadmin' | 'admin' | 'user' | null;

interface RoleContextType {
  role: Role;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        setRole(user.role);
      } catch (e) {
        console.error('Failed to parse adminUser', e);
      }
    }
  }, []);

  return (
    <RoleContext.Provider value={{ role }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
