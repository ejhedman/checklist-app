"use client";

import { useState, useEffect } from "react";
import { AddProjectDialog } from "@/components/projects/AddProjectDialog";
import { createClient } from "@/lib/supabase";
import { ProjectCard, Project } from "@/components/projects/ProjectCard";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        created_at,
        is_manage_members,
        is_manage_features,
        project_user_map(
          user_id,
          members(
            user_id,
            email,
            full_name
          )
        )
      `)
      .order("name");

    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      // Transform the data to flatten the user structure
      const transformedData = data?.map(project => ({
        id: project.id,
        name: project.name,
        created_at: project.created_at,
        is_manage_members: project.is_manage_members,
        is_manage_features: project.is_manage_features,
        users: project.project_user_map?.filter((mapping: any) => mapping.members)?.map((mapping: any) => ({
          id: mapping.members.user_id,
          email: mapping.members.email,
          full_name: mapping.members.full_name
        })) || []
      })) || [];
      
      setProjects(transformedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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