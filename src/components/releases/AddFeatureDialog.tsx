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
import { Loader2, SquarePlus, Bug, Ghost, Lightbulb } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AddFeatureDialogProps {
  releaseId: string;
  releaseName: string;
  onFeatureAdded: () => void;
  onFeatureChanged?: (newFeature: any) => void;
}

export function AddFeatureDialog({ releaseId, releaseName, onFeatureAdded, onFeatureChanged }: AddFeatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Function to get the appropriate icon based on feature type
  const getFeatureTypeIcon = (featureType: string) => {
    switch (featureType) {
      case 'bug':
        return <Bug className="h-4 w-4 text-red-500" />;
      case 'nfr':
        return <Ghost className="h-4 w-4 text-gray-500" />;
      case 'feature':
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };
  const [formData, setFormData] = useState({
    name: "",
    summary: "",
    description: "",
    jiraTicket: "",
    driMemberId: "",
    isPlatform: false,
    isConfig: false,
    featureType: "feature",
    breakingChange: false,
  });
  const [error, setError] = useState("");
  const [members, setMembers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const { user, is_release_manager } = useAuth();

  // Helper function to get member info (id and project_id)
  const getMemberInfo = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("members")
      .select("id, project_id")
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
    
    // Get current user's member info for project filtering
    if (!user?.email) {
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
    
    const { data, error } = await supabase
      .from("members")
      .select("id, full_name, email")
      .eq("project_id", member.project_id)
      .order("full_name");
    
    if (!error && data) {
      setMembers(data);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchMembers();
      // Reset form
      setFormData({
        name: "",
        summary: "",
        description: "",
        jiraTicket: "",
        driMemberId: "",
        isPlatform: false,
        isConfig: false,
        featureType: "feature",
        breakingChange: false,
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

      // Insert new feature
      const insertData = {
        release_id: releaseId,
        name: formData.name,
        summary: formData.summary || null,
        description: formData.description || null,
        jira_ticket: formData.jiraTicket || null,
        dri_member_id: formData.driMemberId || null,
        is_platform: formData.isPlatform,
        is_config: formData.isConfig,
        feature_type: formData.featureType,
        breaking_change: formData.breakingChange,
        is_ready: false, // Always default to false when creating
        project_id: memberInfo?.project_id,
      };
      
      console.log('Inserting feature with data:', insertData);
      
      const { error: featureError, data: featureData } = await supabase
        .from("features")
        .insert(insertData)
        .select()
        .single();
      
      console.log('Database response - error:', featureError);
      console.log('Database response - data:', featureData);

      if (featureError) {
        console.error("Error creating feature:", featureError);
        setError("Failed to create feature: " + featureError.message);
        return;
      }

      // Log activity: feature added to release
      if (user?.id && memberInfo) {
        const { error: activityError } = await supabase.from("activity_log").insert({
          release_id: releaseId,
          feature_id: featureData.id,
          member_id: memberInfo.id,
          project_id: memberInfo.project_id,
          activity_type: "feature_added",
          activity_details: { name: formData.name },
        });
        if (activityError) {
          console.error("Failed to log feature added activity:", activityError);
        } else {
          // console.log("Successfully logged feature added activity");
        }
      }

      setOpen(false);
      if (onFeatureChanged && featureData) {
        // Get the DRI member info for the new feature
        const driMember = formData.driMemberId ? members.find(m => m.id === formData.driMemberId) : null;
        const newFeature = {
          ...featureData,
          dri_member: driMember ? {
            id: driMember.id,
            full_name: driMember.full_name,
            email: driMember.email
          } : null
        };
        onFeatureChanged(newFeature);
      } else {
        onFeatureAdded();
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
          <Button size="sm" variant="outline" title="Add Feature" aria-label="Add Feature">
            <SquarePlus className="h-5 w-5" />
          </Button>
        </DialogTrigger>
      )}
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
              <Label htmlFor="summary" className="text-right">
                Summary
              </Label>
              <Input
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="col-span-3"
                disabled={loading}
                placeholder="Short summary (optional)"
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
              <Label htmlFor="featureType" className="text-right">
                Feature Type
              </Label>
              <Select
                value={formData.featureType}
                onValueChange={(value) => setFormData({ ...formData, featureType: value })}
                disabled={loading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select feature type">
                    {formData.featureType && (
                      <div className="flex items-center gap-2">
                        {getFeatureTypeIcon(formData.featureType)}
                        {formData.featureType === 'feature' ? 'Feature' : 
                         formData.featureType === 'bug' ? 'Bug' : 
                         formData.featureType === 'nfr' ? 'NFR (Non-Functional Requirement)' : formData.featureType}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature" className="flex items-center gap-2">
                    {getFeatureTypeIcon('feature')}
                    Feature
                  </SelectItem>
                  <SelectItem value="bug" className="flex items-center gap-2">
                    {getFeatureTypeIcon('bug')}
                    Bug
                  </SelectItem>
                  <SelectItem value="nfr" className="flex items-center gap-2">
                    {getFeatureTypeIcon('nfr')}
                    NFR (Non-Functional Requirement)
                  </SelectItem>
                </SelectContent>
              </Select>
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
                <Label htmlFor="isConfig">Config Feature</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breakingChange"
                  checked={formData.breakingChange}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, breakingChange: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="breakingChange">Breaking Change</Label>
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