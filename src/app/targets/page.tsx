"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AddTargetDialog } from "@/components/targets/AddTargetDialog";
import { TargetCard, Target } from "@/components/targets/TargetCard";
import { useAuth } from "@/contexts/AuthContext";
import { TargetsRepository } from "@/lib/repository";

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProject } = useAuth();
  
  // Memoize the repository to prevent recreation on every render
  const targetsRepository = useMemo(() => new TargetsRepository(), []);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    
    if (!selectedProject) {
      console.error("No project selected");
      setTargets([]);
      setLoading(false);
      return;
    }
    
    try {
      const targets = await targetsRepository.getTargets(selectedProject.id);
      setTargets(targets);
    } catch (error) {
      console.error("Error fetching targets:", error);
    }
    
    setLoading(false);
  }, [selectedProject, targetsRepository]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0 w-full">
          {/* Not Live column */}
          <div className="min-w-0 w-full">
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
          <div className="min-w-0 w-full">
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