import React, { useEffect, useState } from 'react';

interface SSGWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * SSGWrapper component for handling static site generation (SSG)
 * This component helps with hydration and client-side rendering after the initial static load
 */
export const SSGWrapper: React.FC<SSGWrapperProps> = ({ children, fallback }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client after hydration
    setIsClient(true);
  }, []);

  // During SSG, or before hydration on the client, show the fallback
  if (!isClient && fallback) {
    return <>{fallback}</>;
  }

  // After hydration on the client, or if no fallback is provided, show the children
  return <>{children}</>;
};

export default SSGWrapper;