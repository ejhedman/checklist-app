"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TenantRequiredMessageProps {
  children: React.ReactNode;
}

export function TenantRequiredMessage({ children }: TenantRequiredMessageProps) {
  const { selectedTenant, availableTenants, user, tenantLoading } = useAuth();

  // If still loading tenants, render nothing (or a spinner)
  if (tenantLoading) {
    return null; // or <LoadingSpinner />
  }

  // If user is not logged in, show children (let auth handle it)
  if (!user) {
    return <>{children}</>;
  }

  // If no tenant is selected but user has tenants available
  if (!selectedTenant && availableTenants.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-6 w-6" />
            </div>
            <CardTitle>Select a Project</CardTitle>
            <CardDescription>
              Please select a project from the dropdown in the header to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You have access to {availableTenants.length} project{availableTenants.length !== 1 ? 's' : ''}:
            </p>
            <div className="space-y-2">
              {availableTenants.map((tenant) => (
                <div key={tenant.id} className="text-sm font-medium">
                  {tenant.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has no tenants available
  if (availableTenants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle>No Projects Available</CardTitle>
            <CardDescription>
              You don&apos;t have access to any projects. Please contact your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If tenant is selected, show the children
  return <>{children}</>;
} 