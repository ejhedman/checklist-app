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
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface EditFeatureDialogProps {
  feature: any;
  releaseName: string;
  onFeatureUpdated: () => void;
  onFeatureChanged?: (updatedFeature: any) => void;
}

export function EditFeatureDialog({ feature, releaseName, onFeatureUpdated, onFeatureChanged }: EditFeatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    jiraTicket: "",
    driMemberId: "",
    isPlatform: false,
    isConfig: false,
    comments: "",
  });
  const [error, setError] = useState("");
  const [members, setMembers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const { user, is_release_manager } = useAuth();

  // Helper function to get member info (id and tenant_id)
  const getMemberInfo = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("members")
      .select("id, tenant_id")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching member info:", error);
      return null;
    }
    
    return data;
  };

  // Fetch members when dialog opens
  const fetchMembers = async () => {
    const supabase = createClient();
    
    // Get current user's member info for tenant filtering
    if (!user?.email) {
      console.error("No authenticated user found");
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('tenant_id')
      .eq('email', user.email)
      .single();

    if (memberError || !member) {
      console.error("No member record found for user");
      return;
    }
    
    const { data, error } = await supabase
      .from("members")
      .select("id, full_name, email")
      .eq("tenant_id", member.tenant_id)
      .order("full_name");
    
    if (!error && data) {
      setMembers(data);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchMembers();
      // Initialize form with current feature data
      setFormData({
        name: feature.name || "",
        description: feature.description || "",
        jiraTicket: feature.jira_ticket || "",
        driMemberId: feature.dri_member_id || "",
        isPlatform: feature.is_platform || false,
        isConfig: feature.is_config || false,
        comments: feature.comments || "",
      });
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Get member info for the user performing the action
      let memberInfo = null;
      if (user?.id) {
        memberInfo = await getMemberInfo(user.id);
      }

      // Update feature
      const { error: featureError } = await supabase
        .from("features")
        .update({
          name: formData.name,
          description: formData.description || null,
          jira_ticket: formData.jiraTicket || null,
          dri_member_id: formData.driMemberId || null,
          is_platform: formData.isPlatform,
          is_config: formData.isConfig,
          comments: formData.comments || null,
        })
        .eq("id", feature.id);

      if (featureError) {
        console.error("Error updating feature:", featureError);
        setError("Failed to update feature: " + featureError.message);
        return;
      }

      // Log activity: feature updated
      if (user?.id && memberInfo) {
        const changes = [];
        if (feature.name !== formData.name) changes.push(`name: "${feature.name}" → "${formData.name}"`);
        if (feature.description !== formData.description) changes.push(`description updated`);
        if (feature.jira_ticket !== formData.jiraTicket) changes.push(`jira ticket: "${feature.jira_ticket || 'none'}" → "${formData.jiraTicket || 'none'}"`);
        if (feature.dri_member_id !== formData.driMemberId) changes.push(`dri updated`);
        if (feature.is_platform !== formData.isPlatform) changes.push(`platform: ${feature.is_platform} → ${formData.isPlatform}`);
        if (feature.is_config !== formData.isConfig) changes.push(`config: ${feature.is_config} → ${formData.isConfig}`);
        if (feature.comments !== formData.comments) changes.push(`comments updated`);
        
        if (changes.length > 0) {
          const { error: activityError } = await supabase.from("activity_log").insert({
            release_id: feature.release_id,
            feature_id: feature.id,
            member_id: memberInfo.id,
            tenant_id: memberInfo.tenant_id,
            activity_type: "feature_updated",
            activity_details: { 
              changes: changes,
              oldValues: {
                name: feature.name,
                description: feature.description,
                jira_ticket: feature.jira_ticket,
                dri_member_id: feature.dri_member_id,
                is_platform: feature.is_platform,
                is_config: feature.is_config,
                comments: feature.comments
              },
              newValues: {
                name: formData.name,
                description: formData.description,
                jira_ticket: formData.jiraTicket,
                dri_member_id: formData.driMemberId,
                is_platform: formData.isPlatform,
                is_config: formData.isConfig,
                comments: formData.comments
              }
            },
          });
          if (activityError) {
            console.error("Failed to log feature updated activity:", activityError);
          } else {
            // console.log("Successfully logged feature updated activity");
          }
        }
      }

      setOpen(false);
      if (onFeatureChanged) {
        onFeatureChanged({
          ...feature,
          name: formData.name,
          description: formData.description,
          jira_ticket: formData.jiraTicket,
          dri_member_id: formData.driMemberId,
          is_platform: formData.isPlatform,
          is_config: formData.isConfig,
          comments: formData.comments,
        });
      } else {
        onFeatureUpdated();
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {is_release_manager && (
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Edit className="h-3 w-3" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Feature</DialogTitle>
          <DialogDescription>
            Update the feature details for {releaseName}.
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
              <Label htmlFor="comments" className="text-right">
                Comments
              </Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="col-span-3"
                disabled={loading}
                placeholder="Additional comments or notes"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dri" className="text-right">
                DRI
              </Label>
              <Select
                value={formData.driMemberId || "none"}
                onValueChange={(value) => setFormData({ ...formData, driMemberId: value === "none" ? "" : value })}
                disabled={loading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a DRI (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No DRI assigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name} ({member.email})
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
                <Label htmlFor="isConfig">Configuration Feature</Label>
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
                "Update Feature"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 