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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  nickname?: string;
}

interface EditTeamDialogProps {
  team: Team;
  onTeamUpdated: () => void;
}

export function EditTeamDialog({ team, onTeamUpdated }: EditTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || "",
  });
  const [error, setError] = useState("");
  
  const [allUsers, setAllUsers] = useState<TeamMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch all users and current team members when dialog opens
  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email, nickname")
        .order("full_name");

      if (usersError) {
        console.error("Error fetching users:", usersError);
        return;
      }

      // Fetch current team members
      const { data: members, error: membersError } = await supabase
        .from("team_users")
        .select(`
          user_id,
          users (
            id,
            full_name,
            email,
            nickname
          )
        `)
        .eq("team_id", team.id);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
        return;
      }

      setAllUsers(users || []);
      
      // Transform team members data
      const currentMembers = members?.map((member: any) => member.users) || [];
      setTeamMembers(currentMembers);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form and fetch data
      setFormData({
        name: team.name,
        description: team.description || "",
      });
      setError("");
      setSelectedUserId("");
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      // Update team details
      const { error: teamError } = await supabase
        .from("teams")
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq("id", team.id);

      if (teamError) {
        console.error("Error updating team:", teamError);
        if (teamError.code === '23505') {
          setError("A team with this name already exists. Please choose a different name.");
        } else {
          setError("Failed to update team: " + teamError.message);
        }
        return;
      }

      setOpen(false);
      onTeamUpdated();
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const addMember = async () => {
    if (!selectedUserId) return;

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("team_users")
        .insert({
          team_id: team.id,
          user_id: selectedUserId,
        });

      if (error) {
        console.error("Error adding member:", error);
        setError("Failed to add member: " + error.message);
        return;
      }

      // Refresh team members
      await fetchData();
      setSelectedUserId("");
    } catch (error) {
      console.error("Error adding member:", error);
      setError("An unexpected error occurred");
    }
  };

  const removeMember = async (userId: string) => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("team_users")
        .delete()
        .eq("team_id", team.id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error removing member:", error);
        setError("Failed to remove member: " + error.message);
        return;
      }

      // Refresh team members
      await fetchData();
    } catch (error) {
      console.error("Error removing member:", error);
      setError("An unexpected error occurred");
    }
  };

  // Get available users (not already in the team)
  const availableUsers = allUsers.filter(
    user => !teamMembers.some(member => member.id === user.id)
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team details and manage team members.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {/* Team Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Team Details</h3>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Team Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                    disabled={saving}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                    disabled={saving}
                    rows={3}
                  />
                </div>
              </div>

              {/* Team Members Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Team Members</h3>
                
                {/* Current Members */}
                <div className="space-y-2">
                  <Label>Current Members ({teamMembers.length})</Label>
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.id)}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {teamMembers.length === 0 && (
                      <p className="text-sm text-muted-foreground p-3 border rounded-md">
                        No members in this team
                      </p>
                    )}
                  </div>
                </div>

                {/* Add New Member */}
                {availableUsers.length > 0 && (
                  <div className="space-y-2">
                    <Label>Add Member</Label>
                    <div className="flex gap-2">
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a user to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={addMember}
                        disabled={!selectedUserId || saving}
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
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
        )}
      </DialogContent>
    </Dialog>
  );
} 