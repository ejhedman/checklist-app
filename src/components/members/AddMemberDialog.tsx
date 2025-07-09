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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Search, Check, ChevronsUpDown } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [formData, setFormData] = useState({
    nickname: "",
    member_role: "member" as "member" | "release_manager" | "admin",
  });
  const { selectedProject } = useAuth();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form
      setFormData({
        nickname: "",
        member_role: "member",
      });
      setSelectedUser(null);
      setSearchValue("");
      setAuthUsers([]);
    }
  };

  const searchAuthUsers = async (email: string) => {
    if (email.length < 2) {
      setAuthUsers([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/auth-users/search?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const users = await response.json();
        setAuthUsers(users);
      } else {
        console.error('Failed to search auth users');
        setAuthUsers([]);
      }
    } catch (error) {
      console.error('Error searching auth users:', error);
      setAuthUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAuthUsers(searchValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      alert("Please select a user from the list");
      return;
    }

    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Insert new member using the database function
      const { data, error } = await supabase.rpc('create_member_from_auth_user', {
        auth_user_id: selectedUser.id,
        nickname: formData.nickname || null,
        member_role: formData.member_role,
        project_id: selectedProject.id
      });

      if (error) {
        console.error("Error creating member:", error);
        alert("Failed to create member: " + error.message);
        return;
      }

      setOpen(false);
      onMemberAdded();
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Select an existing user and assign them a member role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                User Email *
              </Label>
              <div className="col-span-3">
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={searchOpen}
                      className="w-full justify-between"
                    >
                      {selectedUser ? selectedUser.email : "Search for user..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search users by email..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2">Searching...</span>
                            </div>
                          ) : (
                            "No users found."
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {authUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.email}
                              onSelect={() => {
                                setSelectedUser(user);
                                setSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{user.email}</span>
                                <span className="text-sm text-muted-foreground">
                                  {user.full_name}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {selectedUser && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Full Name
                </Label>
                <div className="col-span-3 text-sm text-muted-foreground">
                  {selectedUser.full_name}
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                Nickname
              </Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="col-span-3"
                placeholder="Optional nickname"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member_role" className="text-right">
                Role *
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.member_role}
                  onValueChange={(value: "member" | "release_manager" | "admin") =>
                    setFormData({ ...formData, member_role: value })
                  }
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
            <Button type="submit" disabled={loading || !selectedUser}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 