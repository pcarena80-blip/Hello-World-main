import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { LandingPage } from "@/pages/LandingPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { LoginPage } from "@/pages/LoginPage";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { DealProvider } from "@/contexts/DealContext";
import SSGWrapper from "@/components/SSGWrapper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <OrganizationProvider>
          <TaskProvider>
            <DealProvider>
              <Toaster />
              <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/landing" element={
            <SSGWrapper fallback={<div>Loading Landing Page...</div>}>
              <LandingPage />
            </SSGWrapper>
          } />
          <Route path="/signup" element={
            <SSGWrapper fallback={<div>Loading Sign Up Page...</div>}>
              <SignUpPage />
            </SSGWrapper>
          } />
          <Route path="/login" element={
            <SSGWrapper fallback={<div>Loading Login Page...</div>}>
              <LoginPage />
            </SSGWrapper>
          } />
          <Route path="/dashboard" element={
            <AuthGuard>
              <SSGWrapper fallback={<div>Loading Dashboard...</div>}>
                <Index />
              </SSGWrapper>
            </AuthGuard>
          } />
          <Route path="/analytics" element={
            <AuthGuard>
              <SSGWrapper fallback={<div>Loading Analytics Dashboard...</div>}>
                <Dashboard />
              </SSGWrapper>
            </AuthGuard>
          } />
          <Route path="/simple-dashboard" element={<Index />} />
        </Routes>
      </BrowserRouter>
            </DealProvider>
          </TaskProvider>
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
