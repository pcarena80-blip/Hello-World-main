import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('=== AUTHGUARD ===');
    console.log('Auth loading:', isLoading);
    console.log('User:', user);
    console.log('Is authenticated:', isAuthenticated);
    console.log('Is checking:', isChecking);
    
    // Add a small delay to ensure AuthContext has initialized
    const timer = setTimeout(() => {
      console.log('AuthGuard: Timer completed, checking authentication...');
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, isAuthenticated]); // Removed isChecking from dependencies to prevent infinite loop

  useEffect(() => {
    if (!isChecking && !isLoading) {
      if (!isAuthenticated || !user) {
        console.log('AuthGuard: User not authenticated, redirecting to login');
        navigate('/login', { replace: true });
      } else {
        console.log('AuthGuard: User authenticated, allowing access');
      }
    }
  }, [isChecking, isLoading, isAuthenticated, user, navigate]);
  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    console.log('AuthGuard: Showing loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
          <p className="text-xs text-gray-500 mt-2">
            Auth: {isLoading ? 'Loading' : 'Loaded'} | 
            Check: {isChecking ? 'Checking' : 'Complete'} | 
            User: {user ? 'Present' : 'None'} | 
            Auth: {isAuthenticated ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    );
  }

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    console.log('AuthGuard: User not authenticated, showing null');
    return null;
  }

  console.log('AuthGuard: Rendering children');
  return <>{children}</>;
};
