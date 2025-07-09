"use client";

import { useState, useEffect } from "react";
import { AddTargetDialog } from "@/components/targets/AddTargetDialog";
import { createClient } from "@/lib/supabase";
import { TargetCard, Target } from "@/components/targets/TargetCard";
import { useAuth } from "@/contexts/AuthContext";

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProject } = useAuth();

  const fetchTargets = async () => {
    setLoading(true);
    const supabase = createClient();
    
    if (!selectedProject) {
      console.error("No project selected");
      setTargets([]);
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from("targets")
      .select(`
        id,
        short_name,
        name,
        is_live,
        created_at
      `)
      .eq('project_id', selectedProject.id)
      .order("name");

    if (error) {
      console.error("Error fetching targets:", error);
    } else {
      setTargets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedProject) {
      fetchTargets();
    } else {
      setTargets([]);
      setLoading(false);
    }
  }, [selectedProject]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Targets</h1>
          <p className="text-muted-foreground">
            Manage targets and their configurations
          </p>
        </div>
        <AddTargetDialog onTargetAdded={fetchTargets} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading targets...</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {targets.map((target) => (
            <TargetCard
              key={target.id}
              target={target}
              onTargetUpdated={fetchTargets}
            />
          ))}
        </div>
      )}
    </div>
  );
} 