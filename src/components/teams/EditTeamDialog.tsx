"use client";

import { useState, useEffect, useCallback } from "react";
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
  project_id: string;
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
  const [originalFormData, setOriginalFormData] = useState({
    name: team.name,
    description: team.description || "",
  });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [isCheckingName, setIsCheckingName] = useState(false);
  
  const [allUsers, setAllUsers] = useState<TeamMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [originalTeamMembers, setOriginalTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [pendingMembersToAdd, setPendingMembersToAdd] = useState<TeamMember[]>([]);
  const [pendingMembersToRemove, setPendingMembersToRemove] = useState<string[]>([]);

  // Check if any changes have been made
  const hasChanges = () => {
    // Check if form data has changed
    const formDataChanged = 
      formData.name !== originalFormData.name ||
      formData.description !== originalFormData.description;
    
    // Check if team members have changed (including pending changes)
    const membersChanged = 
      pendingMembersToAdd.length > 0 ||
      pendingMembersToRemove.length > 0 ||
      teamMembers.length !== originalTeamMembers.length ||
      teamMembers.some((member, index) => 
        member.id !== originalTeamMembers[index]?.id
      );
    
    // Check if there's a selected user (pending addition)
    const hasSelectedUser = selectedUserId !== "";
    
    return formDataChanged || membersChanged || hasSelectedUser;
  };

  // Check if team name is unique (excluding this team)
  const checkNameUniqueness = useCallback(async (name: string) => {
    if (!name.trim()) {
      setNameError("");
      return;
    }
    setIsCheckingName(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .ilike("name", name.trim())
        .neq("id", team.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking name uniqueness:", error);
        return;
      }
      if (data) {
        setNameError("A team with this name already exists in this project. Please choose a different name.");
      } else {
        setNameError("");
      }
    } catch (error) {
      console.error("Error checking name uniqueness:", error);
    } finally {
      setIsCheckingName(false);
    }
  }, [team.id]);
  // Debounced name validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name.trim()) {
        checkNameUniqueness(formData.name);
      } else {
        setNameError("");
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.name, checkNameUniqueness]);

  // Fetch all users and current team members when dialog opens
  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Get current user's member info for project filtering
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("No authenticated user found");
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('project_id')
        .eq('email', user.email)
        .single();

      if (memberError || !member) {
        console.error("No member record found for user");
        return;
      }

      // Fetch all users (filtered by project)
      const { data: users, error: usersError } = await supabase
        .from("members")
        .select("id, full_name, email, nickname, project_id")
        .eq("project_id", member.project_id)
        .order("full_name");

      if (usersError) {
        console.error("Error fetching users:", usersError);
        return;
      }

      // Fetch current team members
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select(`
          member_id,
          members (
            id,
            full_name,
            email,
            nickname,
            project_id
          )
        `)
        .eq("team_id", team.id);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
        return;
      }

      setAllUsers(users || []);
      
      // Transform team members data
      const currentMembers = (members?.map((member) => member.members) || []).flat();
      setTeamMembers(currentMembers);
      setOriginalTeamMembers(currentMembers);
      setPendingMembersToAdd([]);
      setPendingMembersToRemove([]);
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
      const initialFormData = {
        name: team.name,
        description: team.description || "",
      };
      setFormData(initialFormData);
      setOriginalFormData(initialFormData);
      setError("");
      setSelectedUserId("");
      setPendingMembersToAdd([]);
      setPendingMembersToRemove([]);
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check for name uniqueness before submitting
    if (formData.name.trim()) {
      await checkNameUniqueness(formData.name);
      if (nameError) {
        return;
      }
    }
    
    // Don't submit if no changes have been made
    if (!hasChanges()) {
      return;
    }
    
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

      // Add pending members
      if (pendingMembersToAdd.length > 0) {
        const memberAssignments = pendingMembersToAdd.map((member) => ({
          team_id: team.id,
          member_id: member.id,
          project_id: member.project_id, // Add project_id from the member
        }));
        
        const { error: addError } = await supabase
          .from("team_members")
          .insert(memberAssignments);

        if (addError) {
          console.error("Error adding members:", addError);
          setError("Failed to add some members: " + addError.message);
          return;
        }
      }

      // Remove pending members
      if (pendingMembersToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("team_members")
          .delete()
          .eq("team_id", team.id)
          .in("member_id", pendingMembersToRemove);

        if (removeError) {
          console.error("Error removing members:", removeError);
          setError("Failed to remove some members: " + removeError.message);
          return;
        }
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

  const addMember = () => {
    if (!selectedUserId) return;

    // Find the selected user
    const selectedUser = allUsers.find(user => user.id === selectedUserId);
    if (!selectedUser) return;

    // Add to pending members
    setPendingMembersToAdd(prev => [...prev, selectedUser]);
    
    // Clear the selection
    setSelectedUserId("");
  };

  const removeMember = (userId: string) => {
    // Check if it's a pending member to add
    const pendingAddIndex = pendingMembersToAdd.findIndex(member => member.id === userId);
    if (pendingAddIndex !== -1) {
      setPendingMembersToAdd(prev => prev.filter((_, index) => index !== pendingAddIndex));
      return;
    }

    // Check if it's an existing member
    const existingMember = teamMembers.find(member => member.id === userId);
    if (existingMember) {
      setPendingMembersToRemove(prev => [...prev, userId]);
    }
  };

  // Get available users (not already in the team or pending to add)
  const availableUsers = allUsers.filter(
    user => !teamMembers.some(member => member.id === user.id) &&
            !pendingMembersToAdd.some(member => member.id === user.id) &&
            !pendingMembersToRemove.includes(user.id)
  );

  // Get all current members (existing + pending additions - pending removals)
  const allCurrentMembers = [
    ...teamMembers.filter(member => !pendingMembersToRemove.includes(member.id)),
    ...pendingMembersToAdd
  ];

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
            <div className="grid gap-4 py-4">
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
                    className={`col-span-3 ${nameError ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                    disabled={loading}
                    placeholder="e.g., Frontend Team"
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
                  <Label>Current Members ({allCurrentMembers.length})</Label>
                  <div className="space-y-2">
                    {allCurrentMembers.map((member) => {
                      const isPendingAdd = pendingMembersToAdd.some(m => m.id === member.id);
                      const isPendingRemove = pendingMembersToRemove.includes(member.id);
                      
                      return (
                        <div 
                          key={member.id} 
                          className={`flex items-center justify-between p-3 border rounded-md ${
                            isPendingAdd ? 'bg-green-50 border-green-200' : 
                            isPendingRemove ? 'bg-red-50 border-red-200' : ''
                          }`}
                        >
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            {isPendingAdd && (
                              <p className="text-xs text-green-600 font-medium">(Will be added)</p>
                            )}
                            {isPendingRemove && (
                              <p className="text-xs text-red-600 font-medium">(Will be removed)</p>
                            )}
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
                      );
                    })}
                    {allCurrentMembers.length === 0 && (
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

              {(nameError || error) && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
                  {nameError || error}
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
              <Button 
                type="submit" 
                disabled={saving || !hasChanges()}
                title={!hasChanges() ? "No changes to save" : "Save changes"}
              >
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