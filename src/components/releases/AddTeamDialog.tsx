"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, SquarePlus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AddTeamDialogProps {
  releaseId: string;
  releaseName: string;
  onTeamsUpdated: () => void;
  currentTeams?: Array<{ id: string; name: string }>;
  onTeamsChanged?: (addedTeams: string[], removedTeams: string[]) => void;
}

export function AddTeamDialog({ releaseId, releaseName, onTeamsUpdated, currentTeams = [], onTeamsChanged }: AddTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(currentTeams.map(t => t.id));
  const [error, setError] = useState("");
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const { user, selectedProject, is_release_manager } = useAuth();

  // Helper function to get member info (id and project_id)
  const getMemberInfo = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("members")
      .select("id, project_id")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching member info:", error);
      return null;
    }
    
    return data;
  };

  // Fetch teams when dialog opens
  const fetchTeams = async () => {
    const supabase = createClient();
    
    if (!selectedProject) {
      console.error("No project selected");
      setError("Please select a project first");
      return;
    }
    
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .eq("project_id", selectedProject.id)
      .order("name");
    
    if (!error && data) {
      setTeams(data);
    } else if (error) {
      console.error("Error fetching teams:", error);
      setError("Failed to load teams: " + error.message);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchTeams();
      // Reset form to current teams
      setSelectedTeams(currentTeams.map(t => t.id));
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const supabase = createClient();

      // Get member info for the user performing the action
      let memberInfo = null;
      if (user?.id) {
        memberInfo = await getMemberInfo(user.id);
      }

      // Get current teams for this release
      const { data: currentReleaseTeams, error: currentError } = await supabase
        .from("release_teams")
        .select("team_id")
        .eq("release_id", releaseId);

      if (currentError) {
        console.error("Error fetching current release teams:", currentError);
        setError("Failed to fetch current teams");
        return;
      }

      const currentTeamIds = currentReleaseTeams?.map(rt => rt.team_id) || [];

      // Teams to add (selected but not currently assigned)
      const teamsToAdd = selectedTeams.filter(teamId => !currentTeamIds.includes(teamId));
      
      // Teams to remove (currently assigned but not selected)
      const teamsToRemove = currentTeamIds.filter(teamId => !selectedTeams.includes(teamId));

      // Remove teams that are no longer selected
      if (teamsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("release_teams")
          .delete()
          .eq("release_id", releaseId)
          .in("team_id", teamsToRemove);

        if (removeError) {
          console.error("Error removing teams:", removeError);
          setError("Failed to remove teams: " + removeError.message);
          return;
        }
      }

      // Add new teams
      if (teamsToAdd.length > 0 && selectedProject) {
        const releaseTeamInserts = teamsToAdd.map(teamId => ({
          release_id: releaseId,
          team_id: teamId,
          project_id: selectedProject.id,
        }));

        const { error: addError } = await supabase
          .from("release_teams")
          .insert(releaseTeamInserts);

        if (addError) {
          console.error("Error adding teams:", addError);
          setError("Failed to add teams: " + addError.message);
          return;
        }
      }

      // Log activity for added teams
      if (user?.id && memberInfo && teamsToAdd.length > 0 && selectedProject) {
        for (const teamId of teamsToAdd) {
          const { error: activityError } = await supabase.from("activity_log").insert({
            release_id: releaseId,
            team_id: teamId,
            member_id: memberInfo.id,
            project_id: selectedProject.id,
            activity_type: "team_added",
            activity_details: {},
          });
          if (activityError) {
            console.error("Failed to log team added activity:", activityError);
          }
        }
      }

      setOpen(false);
      // Call the callback to refresh the parent component data
      if (onTeamsChanged) {
        onTeamsChanged(teamsToAdd, teamsToRemove);
      } else {
        onTeamsUpdated();
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {is_release_manager && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" title="Add Team" aria-label="Add Team">
            <SquarePlus className="h-5 w-5" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Teams for {releaseName}</DialogTitle>
          <DialogDescription>
            Select teams to assign to this release. Teams can be added or removed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Teams</h3>
              {teams.length > 0 ? (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`team-${team.id}`}
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={() => handleTeamToggle(team.id)}
                        disabled={loading}
                      />
                      <Label htmlFor={`team-${team.id}`}>{team.name}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No teams available. Create teams first to assign them to releases.
                </p>
              )}
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 