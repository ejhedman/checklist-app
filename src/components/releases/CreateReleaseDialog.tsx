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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface CreateReleaseDialogProps {
  onReleaseSaved: (release: any) => void;
  initialRelease?: any;
  isEdit?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateReleaseDialog({ onReleaseSaved, initialRelease, isEdit = false, open: controlledOpen, onOpenChange }: CreateReleaseDialogProps) {
  const [open, setOpen] = useState(controlledOpen ?? false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialRelease?.name || "",
    targetDate: initialRelease?.target_date || "",
    platformUpdate: initialRelease?.platform_update || false,
    configUpdate: initialRelease?.config_update || false,
    selectedTargets: initialRelease?.targets || [],
    summary: initialRelease?.release_summary || "",
  });
  const [error, setError] = useState("");
  const [targets, setTargets] = useState<Array<{ id: string; short_name: string; name: string }>>([]);
  const { user, selectedTenant, is_release_manager } = useAuth();

  // Helper function to get member info (id and tenant_id)
  const getMemberInfo = async (userId: string) => {
    console.log("Getting member info for user:", userId);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("members")
      .select("id, tenant_id")
      .eq("user_id", userId)
      .single();
    
    console.log("Member query result:", { data, error });
    
    if (error) {
      console.error("Error fetching member info:", error);
      return null;
    }
    
    console.log("Found member info:", data);
    return data;
  };

  // Fetch targets when dialog opens
  const fetchTargets = async () => {
    const supabase = createClient();
    let tenantId = null;
    if (isEdit && initialRelease?.tenant?.id) {
      tenantId = initialRelease.tenant.id;
    } else if (selectedTenant) {
      tenantId = selectedTenant.id;
    }
    if (!tenantId) {
      setTargets([]);
      return;
    }
    const { data, error } = await supabase
      .from("targets")
      .select("id, short_name, name")
      .eq("tenant_id", tenantId)
      .order("name");
    if (!error && data) {
      setTargets(data);
    } else {
      setTargets([]);
    }
  };

  useEffect(() => {
    if (controlledOpen !== undefined) setOpen(controlledOpen);
  }, [controlledOpen]);

  // Ensure fetchTargets is called when dialog opens
  useEffect(() => {
    if (open) {
      console.log("Dialog opened, fetching targets...");
      fetchTargets();
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (newOpen && !isEdit) {
      setFormData({
        name: "",
        targetDate: "",
        platformUpdate: false,
        configUpdate: false,
        selectedTargets: [],
        summary: "",
      });
      setError("");
    }
  };

  useEffect(() => {
    if (isEdit && initialRelease) {
      setFormData({
        name: initialRelease.name || "",
        targetDate: initialRelease.target_date || "",
        platformUpdate: initialRelease.platform_update || false,
        configUpdate: initialRelease.config_update || false,
        selectedTargets: initialRelease.targets || [],
        summary: initialRelease.release_summary || "",
      });
    }
  }, [isEdit, initialRelease]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      
      if (!selectedTenant) {
        setError("Please select a project first");
        setLoading(false);
        return;
      }
      
      let release: any;
      if (isEdit && initialRelease) {
        // Get member info for activity logging
        let memberInfo = null;
        if (user?.id) {
          memberInfo = await getMemberInfo(user.id);
        }
        
        // Update existing release
        const { data: updated, error: updateError } = await supabase
          .from("releases")
          .update({
            name: formData.name,
            target_date: formData.targetDate,
            platform_update: formData.platformUpdate,
            config_update: formData.configUpdate,
            release_summary: formData.summary,
            targets: formData.selectedTargets,
          })
          .eq("id", initialRelease.id)
          .select()
          .single();
        if (updateError) {
          setError("Failed to update release: " + updateError.message);
          return;
        }
        release = updated;
        
        // Log activity: release updated
        if (user?.id && memberInfo) {
          const changes = [];
          if (initialRelease.name !== formData.name) changes.push(`name: "${initialRelease.name}" → "${formData.name}"`);
          if (initialRelease.target_date !== formData.targetDate) changes.push(`target date: "${initialRelease.target_date}" → "${formData.targetDate}"`);
          if (initialRelease.platform_update !== formData.platformUpdate) changes.push(`platform update: ${initialRelease.platform_update} → ${formData.platformUpdate}`);
          if (initialRelease.config_update !== formData.configUpdate) changes.push(`config update: ${initialRelease.config_update} → ${formData.configUpdate}`);
          if (initialRelease.release_summary !== formData.summary) changes.push(`summary updated`);
          
          if (changes.length > 0) {
            const { error: activityError } = await supabase.from("activity_log").insert({
              release_id: initialRelease.id,
              member_id: memberInfo.id,
              tenant_id: selectedTenant.id,
              activity_type: "release_updated",
              activity_details: { 
                changes: changes,
                oldValues: {
                  name: initialRelease.name,
                  target_date: initialRelease.target_date,
                  platform_update: initialRelease.platform_update,
                  config_update: initialRelease.config_update,
                  release_summary: initialRelease.release_summary
                },
                newValues: {
                  name: formData.name,
                  target_date: formData.targetDate,
                  platform_update: formData.platformUpdate,
                  config_update: formData.configUpdate,
                  release_summary: formData.summary
                }
              },
            });
            if (activityError) {
              console.error("Failed to log release updated activity:", activityError);
            } else {
              console.log("Successfully logged release updated activity");
            }
          }
        }
      } else {
        // Create new release
        const templateRes = await fetch('/docs/release-notes-template.md');
        const templateText = await templateRes.text();
        
        // Get member info for tenant_id
        let memberInfo = null;
        if (user?.id) {
          memberInfo = await getMemberInfo(user.id);
        }
        
        const { data: created, error: createError } = await supabase
          .from("releases")
          .insert({
            name: formData.name,
            target_date: formData.targetDate,
            state: "pending",
            platform_update: formData.platformUpdate,
            config_update: formData.configUpdate,
            release_notes: templateText,
            release_summary: formData.summary,
            tenant_id: selectedTenant.id,
            targets: formData.selectedTargets,
          })
          .select()
          .single();
        if (createError) {
          setError("Failed to create release: " + createError.message);
          return;
        }
        release = created;
        // Log activity: release created
        if (user?.id) {
          const memberInfo = await getMemberInfo(user.id);
          if (memberInfo) {
            const { error: activityError } = await supabase.from("activity_log").insert({
              release_id: release.id,
              member_id: memberInfo.id,
              tenant_id: selectedTenant.id,
              activity_type: "release_created",
              activity_details: { name: release.name },
            });
            if (activityError) {
              console.error("Failed to log release created activity:", activityError);
            } else {
              // console.log("Successfully logged release created activity");
            }
          }
        }
      }
      setOpen(false);
      onReleaseSaved(release);
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTargetToggle = (shortName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTargets: prev.selectedTargets.includes(shortName)
        ? prev.selectedTargets.filter((sn: string) => sn !== shortName)
        : [...prev.selectedTargets, shortName],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEdit && is_release_manager && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Release
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Release" : "Create New Release"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Edit the release details." : "Set up a new software release with target date."}
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
            {/* Targets */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assign Targets</h3>
              {targets.length > 0 ? (
                <div className="space-y-2">
                  {targets.map((target) => (
                    <div key={target.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`target-${target.id}`}
                        checked={formData.selectedTargets.includes(target.short_name)}
                        onCheckedChange={() => handleTargetToggle(target.short_name)}
                        disabled={loading}
                      />
                      <Label htmlFor={`target-${target.id}`}>{target.name}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No targets available. Create targets first to assign them to releases.
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
                  {isEdit ? "Saving..." : "Creating..."}
                </>
              ) : (
                isEdit ? "Save Changes" : "Create Release"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 