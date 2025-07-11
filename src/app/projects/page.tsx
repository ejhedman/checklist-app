"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AddProjectDialog } from "@/components/projects/AddProjectDialog";
import { ProjectCard, Project } from "@/components/projects/ProjectCard";
import { ProjectsRepository } from "@/lib/repository";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Memoize the repository to prevent recreation on every render
  const projectsRepository = useMemo(() => new ProjectsRepository(), []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    
    try {
      const projects = await projectsRepository.getProjects();
      setProjects(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
    
    setLoading(false);
  }, [projectsRepository]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage projects and their configurations
          </p>
        </div>
        <AddProjectDialog onProjectAdded={fetchProjects} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onProjectUpdated={fetchProjects}
            />
          ))}
        </div>
      )}
    </div>
  );
} 