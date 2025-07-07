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
import { Pencil, Loader2, X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Tenant } from "./TenantCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditTenantDialogProps {
  tenant: Tenant;
  onTenantUpdated: () => void;
}

export function EditTenantDialog({ tenant, onTenantUpdated }: EditTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant.name,
  });
  const [error, setError] = useState("");
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, email: string, full_name: string}>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [tenantUsers, setTenantUsers] = useState<Array<{id: string, email: string, full_name: string}>>(tenant.users || []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form to current values
      setFormData({
        name: tenant.name,
      });
      setTenantUsers(tenant.users || []);
      setError("");
      fetchAvailableUsers();
    }
  };

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

    // Get current tenant users
    const { data: currentTenantUsers, error: tenantUsersError } = await supabase
      .from("tenant_user_map")
      .select("user_id")
      .eq("tenant_id", tenant.id);

    if (tenantUsersError) {
      console.error("Error fetching tenant users:", tenantUsersError);
      return;
    }

    const currentUserIds = new Set(currentTenantUsers?.map(u => u.user_id) || []);
    
    // Filter out users already in this tenant
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
      
      const { error } = await supabase
        .from("tenant_user_map")
        .insert({
          tenant_id: tenant.id,
          user_id: selectedUserId
        });

      if (error) {
        console.error("Error adding user to tenant:", error);
        setError("Failed to add user to tenant: " + error.message);
        return;
      }

      // Update local state
      const userToAdd = availableUsers.find(u => u.id === selectedUserId);
      if (userToAdd) {
        setTenantUsers([...tenantUsers, userToAdd]);
        setAvailableUsers(availableUsers.filter(u => u.id !== selectedUserId));
        setSelectedUserId("");
      }
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
        .from("tenant_user_map")
        .delete()
        .eq("tenant_id", tenant.id)
        .eq("user_id", userId);

      if (error) {
        console.error("Error removing user from tenant:", error);
        setError("Failed to remove user from tenant: " + error.message);
        return;
      }

      // Update local state
      const userToRemove = tenantUsers.find(u => u.id === userId);
      if (userToRemove) {
        setTenantUsers(tenantUsers.filter(u => u.id !== userId));
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
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Update tenant
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({
          name: formData.name,
        })
        .eq("id", tenant.id)
        .select()
        .single();

      if (tenantError) {
        console.error("Error updating tenant:", tenantError);
        if (tenantError.code === '23505') {
          setError("A tenant with this name already exists. Please choose a different name.");
        } else {
          setError("Failed to update tenant: " + tenantError.message);
        }
        return;
      }

      setOpen(false);
      onTenantUpdated();
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>
            Update tenant information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
                disabled={loading}
                placeholder="e.g., DWH, Production"
              />
            </div>
            
            {/* User Management Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">User Management</Label>
              
              {/* Current Users */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Users:</Label>
                {tenantUsers.length > 0 ? (
                  <div className="space-y-1">
                    {tenantUsers.map((user) => (
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
                  <div className="text-sm text-muted-foreground">No users associated with this tenant</div>
                )}
              </div>
              
              {/* Add User */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Add User:</Label>
                <div className="flex gap-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loading}>
                    <SelectTrigger className="flex-1">
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
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="col-span-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
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
                  Updating...
                </>
              ) : (
                "Update Tenant"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 