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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AddFeatureDialogProps {
  releaseId: string;
  releaseName: string;
  onFeatureAdded: () => void;
}

export function AddFeatureDialog({ releaseId, releaseName, onFeatureAdded }: AddFeatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    jiraTicket: "",
    driUserId: "",
    isPlatform: false,
    isConfig: false,
  });
  const [error, setError] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const { user } = useAuth();

  // Fetch users when dialog opens
  const fetchUsers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .order("full_name");
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchUsers();
      // Reset form
      setFormData({
        name: "",
        description: "",
        jiraTicket: "",
        driUserId: "",
        isPlatform: false,
        isConfig: false,
      });
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Insert new feature
      const { error: featureError, data: featureData } = await supabase
        .from("features")
        .insert({
          release_id: releaseId,
          name: formData.name,
          description: formData.description || null,
          jira_ticket: formData.jiraTicket || null,
          dri_user_id: formData.driUserId || null,
          is_platform: formData.isPlatform,
          is_config: formData.isConfig,
          is_ready: false, // Always default to false when creating
        })
        .select()
        .single();

      if (featureError) {
        console.error("Error creating feature:", featureError);
        setError("Failed to create feature: " + featureError.message);
        return;
      }
      // Log activity: feature added to release
      const { error: activityError } = await supabase.from("activity_log").insert({
        release_id: releaseId,
        feature_id: featureData.id,
        user_id: user?.id,
        activity_type: "feature_added",
        activity_details: { name: formData.name },
      });
      if (activityError) {
        console.error("Failed to log feature added activity:", activityError);
      } else {
        console.log("Successfully logged feature added activity");
      }

      setOpen(false);
      onFeatureAdded();
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
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Feature to {releaseName}</DialogTitle>
          <DialogDescription>
            Add a new feature to this release with a DRI assignment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Feature Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
                disabled={loading}
                placeholder="e.g., User Authentication"
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
                disabled={loading}
                placeholder="Brief description of the feature"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jiraTicket" className="text-right">
                JIRA Ticket
              </Label>
              <Input
                id="jiraTicket"
                value={formData.jiraTicket}
                onChange={(e) => setFormData({ ...formData, jiraTicket: e.target.value })}
                className="col-span-3"
                disabled={loading}
                placeholder="e.g., PROJ-123"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dri" className="text-right">
                DRI
              </Label>
              <Select
                value={formData.driUserId || "none"}
                onValueChange={(value) => setFormData({ ...formData, driUserId: value === "none" ? "" : value })}
                disabled={loading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a DRI (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No DRI assigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPlatform"
                  checked={formData.isPlatform}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isPlatform: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="isPlatform">Platform Feature</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isConfig"
                  checked={formData.isConfig}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isConfig: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="isConfig">Specs Feature</Label>
              </div>
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
                  Adding...
                </>
              ) : (
                "Add Feature"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 