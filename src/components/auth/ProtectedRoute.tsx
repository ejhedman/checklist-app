"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "./LoginDialog";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Welcome to Release Manager</h1>
            <p className="text-muted-foreground">
              Please sign in to access the application.
            </p>
          </div>
          <LoginDialog onLoginSuccess={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 