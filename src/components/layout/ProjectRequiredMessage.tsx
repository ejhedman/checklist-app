"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectRequiredMessageProps {
  children: React.ReactNode;
}

export function ProjectRequiredMessage({ children }: ProjectRequiredMessageProps) {
  const { selectedProject, availableProjects, user, projectLoading } = useAuth();

  // If still loading projects, render nothing (or a spinner)
  if (projectLoading) {
    return null; // or <LoadingSpinner />
  }

  // If user is not logged in, show children (let auth handle it)
  if (!user) {
    return <>{children}</>;
  }

  // If no project is selected but user has projects available
  if (!selectedProject && availableProjects.length > 0) {
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
              You have access to {availableProjects.length} project{availableProjects.length !== 1 ? 's' : ''}:
            </p>
            <div className="space-y-2">
              {availableProjects.map((project) => (
                <div key={project.id} className="text-sm font-medium">
                  {project.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has no projects available
  if (availableProjects.length === 0) {
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

  // If project is selected, show the children
  return <>{children}</>;
} 