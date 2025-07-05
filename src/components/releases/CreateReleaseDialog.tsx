"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface CreateReleaseDialogProps {
  onReleaseCreated: () => void;
}

export function CreateReleaseDialog({ onReleaseCreated }: CreateReleaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetDate: "",
    platformUpdate: false,
    configUpdate: false,
    selectedTeams: [] as string[],
    summary: "",
  });
  const [error, setError] = useState("");
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch teams when dialog opens
  const fetchTeams = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .order("name");
    
    if (!error && data) {
      setTeams(data);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchTeams();
      // Reset form
      setFormData({
        name: "",
        targetDate: "",
        platformUpdate: false,
        configUpdate: false,
        selectedTeams: [],
        summary: "",
      });
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Fetch the release notes template
      const templateRes = await fetch('/docs/release-notes-template.md');
      const templateText = await templateRes.text();

      const supabase = createClient();

      // Insert new release
      const { data: release, error: releaseError } = await supabase
        .from("releases")
        .insert({
          name: formData.name,
          target_date: formData.targetDate,
          state: "pending",
          platform_update: formData.platformUpdate,
          config_update: formData.configUpdate,
          release_notes: templateText,
          release_summary: formData.summary,
        })
        .select()
        .single();

      if (releaseError) {
        console.error("Error creating release:", releaseError);
        setError("Failed to create release: " + releaseError.message);
        return;
      }

      // Add selected teams to the release
      if (formData.selectedTeams.length > 0 && release) {
        const teamAssignments = formData.selectedTeams.map(teamId => ({
          release_id: release.id,
          team_id: teamId,
        }));

        const { error: teamError } = await supabase
          .from("release_teams")
          .insert(teamAssignments);

        if (teamError) {
          console.error("Error assigning teams:", teamError);
          // Don't fail the whole operation, just log the error
        }
      }

      setOpen(false);
      onReleaseCreated();
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTeams: prev.selectedTeams.includes(teamId)
        ? prev.selectedTeams.filter(id => id !== teamId)
        : [...prev.selectedTeams, teamId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Release
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Release</DialogTitle>
          <DialogDescription>
            Set up a new software release with target date and team assignments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Release Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Release Details</h3>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Release Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  required
                  disabled={loading}
                  placeholder="e.g., v2.1.0 - Feature Release"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetDate" className="text-right">
                  Target Date *
                </Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="col-span-3"
                  required
                  disabled={loading}
                />
              </div>

            </div>

            {/* Release Scope */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Release Scope</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="platformUpdate"
                  checked={formData.platformUpdate}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, platformUpdate: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="platformUpdate">Platform Update Required</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="configUpdate"
                  checked={formData.configUpdate}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, configUpdate: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="configUpdate">Specs Update Required</Label>
              </div>
            </div>

            {/* Team Assignments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assign Teams</h3>
              
              {teams.length > 0 ? (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`team-${team.id}`}
                        checked={formData.selectedTeams.includes(team.id)}
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Release"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 