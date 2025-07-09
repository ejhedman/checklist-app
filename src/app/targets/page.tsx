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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Not Live column */}
          <div>
            <h3 className="font-bold mb-2">Not Live</h3>
            {targets.filter(t => !t.is_live).length === 0 ? (
              <div className="text-muted-foreground">No non-live targets</div>
            ) : (
              targets.filter(t => !t.is_live).map((target) => (
                <div key={target.id} className="mb-4">
                  <TargetCard target={target} onTargetUpdated={fetchTargets} />
                </div>
              ))
            )}
          </div>
          {/* Live column */}
          <div>
            <h3 className="font-bold mb-2">Live</h3>
            {targets.filter(t => t.is_live).length === 0 ? (
              <div className="text-muted-foreground">No live targets</div>
            ) : (
              targets.filter(t => t.is_live).map((target) => (
                <div key={target.id} className="mb-4">
                  <TargetCard target={target} onTargetUpdated={fetchTargets} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 