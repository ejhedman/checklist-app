"use client";

// import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Briefcase, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function ProjectSelector() {
  const { availableProjects, selectedProject, setSelectedProject, user } = useAuth();
  // const [open, setOpen] = useState(false);

  // Don't show selector if user is not logged in
  if (!user) {
    return null;
  }

  // Don't show selector if user has no projects
  if (availableProjects.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">No projects available</span>
        <span className="sm:hidden">No projects</span>
      </div>
    );
  }

  // Don't show selector if user has only one project (it's auto-selected)
  if (availableProjects.length === 1) {
    return (
      <TooltipProvider>
        <div className="flex items-center space-x-2 text-xs sm:text-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Selected Project</p>
            </TooltipContent>
          </Tooltip>
          <span className="hidden sm:inline">{selectedProject?.name}</span>
          <span className="sm:hidden max-w-[80px] truncate">{selectedProject?.name}</span>
        </div>
      </TooltipProvider>
    );
  }

  // Show selector for users with multiple projects
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Selected Project</p>
          </TooltipContent>
        </Tooltip>
        <Select
          value={selectedProject?.id || ""}
          onValueChange={(value) => {
            const project = availableProjects.find(t => t.id === value);
            setSelectedProject(project || null);
          }}
        >
          <SelectTrigger className="w-[120px] sm:w-[200px] text-xs sm:text-sm">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {availableProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </TooltipProvider>
  );
} 