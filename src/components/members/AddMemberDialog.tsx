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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMembers } from "@/hooks/useMembers";
import { Checkbox } from "@/components/ui/checkbox";

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface AddMemberDialogProps {
  onMemberAdded: () => void;
}

export function AddMemberDialog({ onMemberAdded }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<AuthUser[]>([]);
  const [formData, setFormData] = useState({
    member_role: "member" as "member" | "release_manager" | "admin",
  });
  const { selectedProject } = useAuth();
  const { members } = useMembers();
  const [emailError, setEmailError] = useState("");

  const handleOpenChange = useCallback((newOpen: boolean) => {
    console.log('Dialog open state changing to:', newOpen);
    setOpen(newOpen);
    if (newOpen) {
      console.log('Dialog opened, resetting form');
      // Reset form
      setFormData({
        member_role: "member",
      });
      setSelectedUsers([]);
      setSearchValue("");
      setAuthUsers([]);
    }
  }, []);

  const searchAuthUsers = useCallback(async (email: string) => {
    if (!selectedProject) {
      console.log('No project selected, cannot search for users');
      setAuthUsers([]);
      return;
    }

    console.log('Searching for users with email:', email);
    console.log('Project ID:', selectedProject.id);

    setSearchLoading(true);
    try {
      // If email is empty or very short, search for all users
      const searchParam = email.length < 2 ? "" : email;
      const response = await fetch(`/api/auth-users/search?email=${encodeURIComponent(searchParam)}&projectId=${selectedProject.id}`);
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const users = await response.json();
        console.log('API Response users:', users);
        console.log('Number of users found:', users.length);
        setAuthUsers(users);
      } else {
        const errorText = await response.text();
        console.error('Failed to search auth users. Status:', response.status, 'Error:', errorText);
        setAuthUsers([]);
      }
    } catch (error) {
      console.error('Error searching auth users:', error);
      setAuthUsers([]);
    } finally {
      setSearchLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    console.log('useEffect triggered - searchValue:', searchValue);
    const timeoutId = setTimeout(() => {
      console.log('Searching after timeout with value:', searchValue);
      // Always search, even with empty value to show all users
      searchAuthUsers(searchValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue, searchAuthUsers]);

  // Trigger search when dialog opens
  useEffect(() => {
    if (open && selectedProject) {
      console.log('Dialog opened, searching for all users');
      searchAuthUsers("");
    }
  }, [open, selectedProject, searchAuthUsers]);

  useEffect(() => {
    if (!selectedUsers.length || !members) {
      setEmailError("");
      return;
    }
    const emailTaken = selectedUsers.some(
      (user) => members.some(m => m.email.toLowerCase() === user.email.toLowerCase())
    );
    setEmailError(emailTaken ? "One or more selected users already exist as members in this project." : "");
  }, [selectedUsers, members]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUsers.length) {
      alert("Please select at least one user from the list");
      return;
    }

    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    if (emailError) {
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Insert new member using the database function
      for (const user of selectedUsers) {
        console.log('Adding user:', user);
        const { error } = await supabase.rpc('create_member_from_auth_user', {
          auth_user_id: user.id,
          project_id: selectedProject.id,
          member_role: formData.member_role
        });

        if (error) {
          console.error("Error creating member:", error);
          alert("Failed to create member: " + error.message);
          return;
        }
      }

      setOpen(false);
      onMemberAdded();
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedUsers, selectedProject, emailError, formData.member_role, onMemberAdded]);

  const handleUserToggle = useCallback((user: AuthUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const handleRoleChange = useCallback((value: "member" | "release_manager" | "admin") => {
    setFormData(prev => ({ ...prev, member_role: value }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="border border-gray-300 rounded-md p-1 hover:bg-gray-100"
          aria-label="Add Member"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Members</DialogTitle>
          <DialogDescription>
            Select users to add as members to this project. Only users not already in the project are shown.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="grid gap-4 py-4 flex-1">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="search" className="text-right">
                Search Users
              </Label>
              <div className="col-span-3">
                <Input
                  id="search"
                  placeholder="Search users by email..."
                  value={searchValue}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Available Users
              </Label>
              <div className="col-span-3 max-h-64 overflow-y-auto border rounded-md p-2">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Searching...</span>
                  </div>
                ) : authUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchValue.length > 0 ? "No users found." : "No users available to add."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {authUsers.map((user) => {
                      const isSelected = selectedUsers.some(u => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          className={cn(
                            "flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer",
                            isSelected && "bg-accent"
                          )}
                          onClick={() => handleUserToggle(user)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleUserToggle(user)}
                            onClick={e => e.stopPropagation()}
                          />
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">{user.email}</span>
                            <span className="text-sm text-muted-foreground">
                              {user.full_name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Selected Users
                </Label>
                <div className="col-span-3 text-sm text-muted-foreground">
                  {selectedUsers.length === 1 
                    ? selectedUsers[0].full_name 
                    : `${selectedUsers.length} users selected`
                  }
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member_role" className="text-right">
                Role *
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.member_role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="release_manager">Release Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {emailError && (
              <div className="col-span-4 text-red-600 text-xs">{emailError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedUsers.length || !!emailError}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                selectedUsers.length === 1 ? "Add Member" : `Add ${selectedUsers.length} Members`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 