import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Trash2, Users, Settings } from "lucide-react";
import { EditProjectDialog } from "./EditProjectDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

export interface Project {
  id: string;
  name: string;
  created_at: string;
  users?: Array<{
    id: string;
    email: string;
    full_name: string;
  }>;
  is_manage_members?: boolean;
  is_manage_features?: boolean;
}

interface ProjectCardProps {
  project: Project;
  onProjectUpdated: () => void;
}

export function ProjectCard({ project, onProjectUpdated }: ProjectCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

      if (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete project: " + error.message);
        return;
      }

      onProjectUpdated();
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred while deleting the project");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            {project.name}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <EditProjectDialog project={project} onProjectUpdated={onProjectUpdated} />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDelete}
              disabled={deleting}
              className="border border-gray-300 rounded-md p-1 hover:bg-red-100 hover:text-red-600"
              aria-label="Delete Project"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Created: {new Date(project.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 min-w-0 w-full">
        {/* Management Flags */}
        <div className="flex flex-wrap gap-2 sm:flex-row flex-col">
          <Badge variant={project.is_manage_members ? "default" : "secondary"} className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {project.is_manage_members ? "Manage Members" : "No Member Management"}
          </Badge>
          <Badge variant={project.is_manage_features ? "default" : "secondary"} className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            {project.is_manage_features ? "Manage Features" : "No Feature Management"}
          </Badge>
        </div>
        
        {project.users && project.users.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground pt-4">Associated Users:</h4>
            <div className="space-y-1 pl-4 min-w-0 w-full">
              {project.users.map((user) => (
                <div key={user.id} className="text-sm text-muted-foreground break-all">
                  {user.email}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No users associated with this project
          </div>
        )}
      </CardContent>
    </Card>
  );
} 