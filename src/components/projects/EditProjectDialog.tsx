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
import { Pencil, Loader2, X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Project } from "./ProjectCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditProjectDialogProps {
  project: Project;
  onProjectUpdated: () => void;
}

export function EditProjectDialog({ project, onProjectUpdated }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name,
    is_manage_members: project.is_manage_members ?? true,
    is_manage_features: project.is_manage_features ?? true,
  });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, email: string, full_name: string}>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [projectUsers, setProjectUsers] = useState<Array<{id: string, email: string, full_name: string}>>(project.users || []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form to current values
      setFormData({
        name: project.name,
        is_manage_members: project.is_manage_members ?? true,
        is_manage_features: project.is_manage_features ?? true,
      });
      setProjectUsers(project.users || []);
      setError("");
      setNameError("");
      fetchAvailableUsers();
    }
  };

  // Check if project name is unique (excluding this project)
  const checkNameUniqueness = useCallback(async (name: string) => {
    if (!name.trim()) {
      setNameError("");
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .ilike("name", name.trim())
        .neq("id", project.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking name uniqueness:", error);
        return;
      }
      if (data) {
        setNameError("A project with this name already exists. Please choose a different name.");
      } else {
        setNameError("");
      }
    } catch (error) {
      console.error("Error checking name uniqueness:", error);
    }
  }, [project.id]);

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

  const fetchAvailableUsers = async () => {
    const supabase = createClient();
    
    // Get all users
    const { data: allUsers, error: allUsersError } = await supabase
      .from("members")
      .select("user_id, email, full_name")
      .not("user_id", "is", null);

    if (allUsersError) {
      console.error("Error fetching users:", allUsersError);
      return;
    }

    // Get current project users
    const { data: currentProjectUsers, error: projectUsersError } = await supabase
      .from("members")
      .select("user_id")
      .eq("project_id", project.id);

    if (projectUsersError) {
      console.error("Error fetching project users:", projectUsersError);
      return;
    }

    const currentUserIds = new Set(currentProjectUsers?.map(u => u.user_id) || []);
    
    // Filter out users already in this project
    const available = allUsers?.filter(user => !currentUserIds.has(user.user_id))
      .map(user => ({
        id: user.user_id,
        email: user.email,
        full_name: user.full_name
      })) || [];
    setAvailableUsers(available);
  };

  const handleAddUser = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      const supabase = createClient();
      // Use info from availableUsers
      const userToAdd = availableUsers.find(u => u.id === selectedUserId);
      if (!userToAdd) {
        setError("User not found in available users");
        return;
      }
      // Create member record for this user in the project
      const { error } = await supabase
        .from("members")
        .insert({
          user_id: userToAdd.id,
          email: userToAdd.email,
          full_name: userToAdd.full_name,
          project_id: project.id,
          member_role: 'member'
        });

      if (error) {
        console.error("Error adding user to project:", error);
        setError("Failed to add user to project: " + error.message);
        return;
      }

      // Update local state
      setProjectUsers([...projectUsers, userToAdd]);
      setAvailableUsers(availableUsers.filter(u => u.id !== selectedUserId));
      setSelectedUserId("");
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("project_id", project.id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error removing user from project:", error);
        setError("Failed to remove user from project: " + error.message);
        return;
      }

      // Update local state
      const userToRemove = projectUsers.find(u => u.id === userId);
      if (userToRemove) {
        setProjectUsers(projectUsers.filter(u => u.id !== userId));
        setAvailableUsers([...availableUsers, userToRemove]);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
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
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Update project
      const { error: projectError } = await supabase
        .from("projects")
        .update({
          name: formData.name,
          is_manage_members: formData.is_manage_members,
          is_manage_features: formData.is_manage_features,
        })
        .eq("id", project.id)
        .select()
        .single();

      if (projectError) {
        console.error("Error updating project:", projectError);
        if (projectError.code === '23505') {
          setError("A project with this name already exists. Please choose a different name.");
        } else {
          setError("Failed to update project: " + projectError.message);
        }
        return;
      }

      setOpen(false);
      onProjectUpdated();
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 py-4">
            {/* Project Name */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={nameError ? 'border-red-500 focus:border-red-500' : ''}
                required
                disabled={loading}
                placeholder="e.g., DWH, Production"
              />
            </div>

            {/* Manage Members Checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="is_manage_members"
                type="checkbox"
                checked={formData.is_manage_members}
                onChange={e => setFormData({ ...formData, is_manage_members: e.target.checked })}
                disabled={loading}
              />
              <Label htmlFor="is_manage_members" className="mb-0 cursor-pointer">Manage Members</Label>
            </div>

            {/* Manage Features Checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="is_manage_features"
                type="checkbox"
                checked={formData.is_manage_features}
                onChange={e => setFormData({ ...formData, is_manage_features: e.target.checked })}
                disabled={loading}
              />
              <Label htmlFor="is_manage_features" className="mb-0 cursor-pointer">Manage Features</Label>
            </div>

            {/* User Management Section */}
            <div className="flex flex-col gap-2 pt-2">
              <Label className="text-base font-medium">User Management</Label>
              {/* Current Users */}
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Current Users:</Label>
                {projectUsers.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {projectUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="text-sm">{user.email} ({user.full_name})</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No users associated with this project</div>
                )}
              </div>
              {/* Add User */}
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium">Add User:</Label>
                <div className="flex pr-4 gap-0 items-center">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading}>
                    <SelectTrigger className="flex-1 max-w-[340px]">
                      <SelectValue placeholder="Select a user to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email} ({user.full_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={handleAddUser}
                    disabled={!selectedUserId || loading}
                    size="sm"
                    className="ml-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {(nameError || error) && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
              {nameError || error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!nameError}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 