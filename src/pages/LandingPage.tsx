import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowRight, User, Lock } from "lucide-react";
import { useEffect, useState } from "react";

// Static data that would be pre-fetched during build time
const staticFeatures = [
  { id: 1, title: "AI-Powered CRM", description: "Leverage artificial intelligence to boost your customer relationships" },
  { id: 2, title: "Team Collaboration", description: "Work together seamlessly with integrated chat and task management" },
  { id: 3, title: "Data Analytics", description: "Make informed decisions with comprehensive analytics and reporting" }
];

// Type for our static data
interface StaticPageData {
  features: Array<{ id: number; title: string; description: string }>;
  preRenderedAt: string;
  clientFetchedAt?: string; // Optional property for client-side data
}

export const LandingPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [pageData, setPageData] = useState<StaticPageData>({
    features: staticFeatures,
    preRenderedAt: new Date().toISOString()
  });
  const [isClientSide, setIsClientSide] = useState(false);

  // Detect if we're on the client side
  useEffect(() => {
    setIsClientSide(true);
    
    // Simulate fetching additional data on the client side
    const fetchAdditionalData = async () => {
      // In a real app, this would be an API call
      // For demo purposes, we're just adding a timestamp
      return { clientFetchedAt: new Date().toISOString() };
    };
    
    // Combine static data with client-side data
    fetchAdditionalData().then(additionalData => {
      setPageData(prev => ({ ...prev, ...additionalData }));
    });
  }, [pageData]);

  // Automatically clear any stored user data when landing page loads
  useEffect(() => {
    // Only clear data if we're not already in the process of clearing
    if (isAuthenticated && user && !localStorage.getItem('clearing_auth')) {
      console.log('Clearing stored user data for fresh start...');
      localStorage.setItem('clearing_auth', 'true');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      // Use a timeout to prevent immediate reload
      setTimeout(() => {
        localStorage.removeItem('clearing_auth');
        window.location.reload();
      }, 100);
    }
  }, [isAuthenticated, user]);

  // If we're clearing auth, show a loading state
  if (localStorage.getItem('clearing_auth')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing fresh start...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">Silver Ant Marketing</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to EnterpriseCRM
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A comprehensive CRM solution for modern businesses. Manage leads, deals, tasks, and team collaboration all in one place.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {pageData.features.map(feature => (
              <Card key={feature.id}>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      {feature.id === 1 ? (
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      ) : feature.id === 2 ? (
                        <User className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Lock className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* SSG Information - Only visible on client side */}
          {isClientSide && (
            <div className="bg-gray-100 p-4 rounded-lg mb-8 text-sm">
              <h3 className="font-medium mb-2">Static Site Generation (SSG) Demo</h3>
              <p><strong>Pre-rendered at:</strong> {pageData.preRenderedAt}</p>
              {pageData.clientFetchedAt && (
                <p><strong>Client-side data fetched at:</strong> {pageData.clientFetchedAt}</p>
              )}
              <p className="text-gray-500 mt-2 text-xs">This section demonstrates how SSG works - combining pre-rendered content with client-side data.</p>
            </div>
          )}

        {/* Authentication Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? "..." : isAuthenticated ? "✅" : "❌"}
                </div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-xs text-gray-500">
                  {isLoading ? "Loading..." : isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {user ? "👤" : "👤"}
                </div>
                <p className="text-sm text-gray-600">User</p>
                <p className="text-xs text-gray-500">
                  {user ? user.name : "None"}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {user ? user.email : "📧"}
                </div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-xs text-gray-500">
                  {user ? user.email : "Not logged in"}
                </p>
              </div>
            </div>

            {user && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Current User Details:</h3>
                <pre className="text-sm text-green-700 bg-green-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
                </div>
            )}
            </CardContent>
          </Card>

        {/* Test Credentials */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Test Credentials
            </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">User 1:</h3>
                <p className="text-sm text-blue-700"><strong>Email:</strong> suham@gmail.com</p>
                <p className="text-sm text-blue-700"><strong>Password:</strong> 12345678</p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">User 2:</h3>
                <p className="text-sm text-green-700"><strong>Email:</strong> test@example.com</p>
                <p className="text-sm text-green-700"><strong>Password:</strong> ********</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> These are test credentials. In a production environment, 
                you would need to register these users first or use proper authentication.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isAuthenticated ? (
            <>
              <Button
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = "/login"}
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.location.href = "/signup"}
              >
                Create Account
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => window.location.href = "/dashboard"}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = "/landing"}
              >
                Refresh Status
              </Button>
              <Button
                variant="outline" 
                size="lg"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => {
                  localStorage.removeItem('user');
                  sessionStorage.removeItem('user');
                  window.location.reload();
                }}
              >
                Clear Login & Test Again
              </Button>
            </>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Debug Information:</h3>
          <pre className="text-xs text-gray-600 bg-white p-2 rounded overflow-x-auto">
            {JSON.stringify({
              isLoading,
              isAuthenticated,
              user,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
