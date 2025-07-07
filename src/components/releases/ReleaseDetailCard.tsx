"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock, Calendar, Pencil, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FeatureReadyDialog } from "@/components/releases/FeatureReadyDialog";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import FeatureCard from "./FeatureCard";
import { CreateReleaseDialog } from "./CreateReleaseDialog";
import { AddFeatureDialog } from "./AddFeatureDialog";

export function getStateColor(state: string) {
  switch (state) {
    case "past_due":
      return "bg-red-500";
    case "ready":
      return "bg-green-500";
    case "pending":
      return "bg-yellow-300";
    case "complete":
      return "bg-blue-500";
    default:
      return "bg-gray-200";
  }
}

export function getStateIcon(state: string) {
  switch (state) {
    case "past_due":
      return <AlertTriangle className="h-4 w-4" />;
    case "ready":
      return <CheckCircle className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "complete":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
}

// Helper to calculate days until target date
function getDaysUntil(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const today = new Date();
  const target = new Date(year, month - 1, day);
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Map release state to a pale background color for the header (copied from ReleaseSummaryCard)
function getPaleBgForState(state: string, is_archived?: boolean) {
  if (is_archived) return "bg-gray-200";
  switch (state) {
    case "ready":
      return "bg-green-50";
    case "pending":
      return "bg-amber-50";
    case "past_due":
      return "bg-red-50";
    case "complete":
      return "bg-blue-50";
    default:
      return "bg-gray-50";
  }
}

export default function ReleaseDetailCard({ release, onMemberReadyChange, onReleaseUpdated } : {
  release: any,
  onMemberReadyChange?: (releaseId: string, userId: string, isReady: boolean) => void,
  onReleaseUpdated: (updatedRelease: any) => void,
}) {
  const { user, memberId } = useAuth();
  const [readyDialogOpen, setReadyDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [updatingFeature, setUpdatingFeature] = useState(false);
  const [isArchived, setIsArchived] = useState(release.is_archived);
  const [archiving, setArchiving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [features, setFeatures] = useState(release.features);

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

  // Add local state for summary counts
  const [readyMembers, setReadyMembers] = useState(release.ready_members);
  const [totalMembers, setTotalMembers] = useState(release.total_members);
  const [readyFeatures, setReadyFeatures] = useState(release.ready_features);
  const [featureCount, setFeatureCount] = useState(release.feature_count);

  // Collect all unique members from all teams (move this to state)
  const getAllMembers = () => {
    const memberMap = new Map();
    release.teams.forEach((team: any) => {
      team.members.forEach((member: any) => {
        if (!memberMap.has(member.id)) {
          memberMap.set(member.id, member);
        }
      });
    });
    return Array.from(memberMap.values());
  };
  const [allMembers, setAllMembers] = useState(getAllMembers());
  useEffect(() => {
    setAllMembers(getAllMembers());
  }, [release.teams]);

  useEffect(() => {
    setIsArchived(release.is_archived);
  }, [release.is_archived]);

  useEffect(() => {
    setFeatures(release.features);
  }, [release.features]);

  // Keep counts in sync with allMembers and features
  useEffect(() => {
    setReadyMembers(allMembers.filter((m: any) => m.is_ready).length);
    setTotalMembers(allMembers.length);
  }, [allMembers]);
  useEffect(() => {
    setReadyFeatures(features.filter((f: any) => f.is_ready).length);
    setFeatureCount(features.length);
  }, [features]);

  const handleArchiveChange = async (checked: boolean) => {
    setArchiving(true);
    setIsArchived(checked);
    const supabase = createClient();
    const { error } = await supabase
      .from("releases")
      .update({ is_archived: checked })
      .eq("id", release.id);
    if (error) {
      console.error('Failed to update is_archived:', error);
      // Optionally, show a toast or error message to the user
    } else {
      // console.log('is_archived updated successfully');
    }
    setArchiving(false);
    // Optionally, handle error or refresh data
  };

  const handleFeatureReadyChange = async (feature: any, isReady: boolean) => {
    // Check if current user is the DRI for this feature
    if (!user || !feature.dri_member || memberId !== feature.dri_member.id) {
      return;
    }
    // Immediately update without dialog
    await updateFeatureReady(feature.id, isReady, "");
  };

  const updateFeatureReady = async (featureId: string, isReady: boolean, comments: string) => {
    setUpdatingFeature(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("features")
      .update({
        is_ready: isReady,
        comments: comments || null,
      })
      .eq("id", featureId);
    if (error) {
      console.error('Error updating feature ready state:', error);
    } else {
      setFeatures((prev: any[]) =>
        prev.map((f: any) =>
          f.id === featureId ? { ...f, is_ready: isReady, comments } : f
        )
      );
    }
    setUpdatingFeature(false);
  };

  const handleReadyDialogConfirm = async (comments: string) => {
    if (selectedFeature) {
      await updateFeatureReady(selectedFeature.id, true, comments);
      // Log activity: DRI marked feature ready
      if (user?.id) {
        const memberInfo = await getMemberInfo(user.id);
        if (memberInfo) {
          const supabase = createClient();
          const { error: activityError } = await supabase.from("activity_log").insert({
            release_id: release.id,
            feature_id: selectedFeature.id,
            member_id: memberInfo.id,
            tenant_id: memberInfo.tenant_id,
            activity_type: "feature_ready",
            activity_details: { comments },
          });
          if (activityError) {
            console.error("Failed to log feature ready activity:", activityError);
          } else {
            // console.log("Successfully logged feature ready activity");
          }
        }
      }
      setReadyDialogOpen(false);
      setSelectedFeature(null);
    }
  };

  const handleReadyDialogCancel = () => {
    setReadyDialogOpen(false);
    setSelectedFeature(null);
  };

  const updateMemberReady = async (releaseId: string, memberId: string, isReady: boolean) => {
    const supabase = createClient();
    
    // Find the member to get their tenant_id
    let memberTenantId = null;
    if (release && release.teams) {
      for (const team of release.teams) {
        const member = team.members?.find((m: any) => m.id === memberId);
        if (member) {
          memberTenantId = member.tenant_id;
          break;
        }
      }
    }
    
    // If we can't find the member's tenant_id, use the release's tenant_id as fallback
    if (!memberTenantId && release?.tenant?.id) {
      memberTenantId = release.tenant.id;
    }
    
    const { error } = await supabase
      .from("member_release_state")
      .upsert({
        release_id: releaseId,
        member_id: memberId,
        tenant_id: memberTenantId,
        is_ready: isReady,
      });
    if (error) {
      console.error("Error updating member ready state:", error);
    } else {
      setAllMembers((prev: any[]) =>
        prev.map((m: any) =>
          m.id === memberId ? { ...m, is_ready: isReady } : m
        )
      );
    }
  };

  const handleStateChange = async (newState: string) => {
    if (release.state === newState) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("releases")
      .update({ state: newState })
      .eq("id", release.id);
    if (!error) {
      // Log activity: release state change
      if (user?.id) {
        const memberInfo = await getMemberInfo(user.id);
        if (memberInfo) {
          const { error: activityError } = await supabase.from("activity_log").insert({
            release_id: release.id,
            member_id: memberInfo.id,
            tenant_id: memberInfo.tenant_id,
            activity_type: "release_state_change",
            activity_details: { oldState: release.state, newState },
          });
          if (activityError) {
            console.error("Failed to log release state change activity:", activityError);
          } else {
            // console.log("Successfully logged release state change activity");
          }
        }
      }
      // Optionally refresh or notify parent
      onReleaseUpdated?.(undefined);
    }
  };

  // Check if the current user is a DRI on any features
  const isUserDRI = () => {
    if (!memberId || !release.features) return false;
    return release.features.some((feature: any) => feature.dri_member_id === memberId);
  };
  // Check if the current user is a member of any teams in this release
  const isUserMember = () => {
    if (!memberId || !release.teams) return false;
    return release.teams.some((team: any) =>
      team.members?.some((member: any) => member.id === memberId)
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className={`w-full ${getPaleBgForState(release.state, release.is_archived)}`}>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="relative w-full flex items-center" style={{ minHeight: '48px' }}>
            <div className="flex items-center gap-3">
              {getStateIcon(release.state)}
              <CardTitle className="truncate text-lg">
                {release.tenant?.name ? `${release.tenant.name}: ` : ''}{release.name}
              </CardTitle>
              {release.state === "ready" ? (
                <Badge className="bg-green-600 text-white ml-2" variant="default">
                  {release.state.replace("_", " ")}
                </Badge>
              ) : release.state === "pending" ? (
                <Badge className="bg-amber-400 text-black ml-2" variant="default">
                  {release.state.replace("_", " ")}
                </Badge>
              ) : release.state === "past_due" ? (
                <Badge className="bg-red-500 text-white ml-2" variant="default">
                  {release.state.replace("_", " ")}
                </Badge>
              ) : release.state === "complete" ? (
                <Badge className="bg-blue-500 text-white ml-2" variant="default">
                  {release.state.replace("_", " ")}
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">
                  {release.state.replace("_", " ")}
                </Badge>
              )}
            </div>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {(() => {
                const days = getDaysUntil(release.target_date);
                const [year, month, day] = release.target_date.split('-');
                const dateStr = `${Number(month)}/${Number(day)}/${year}`;
                return `Target Date: ${dateStr} (${days} days)`;
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/releases/${encodeURIComponent(release.name)}/releasenotes`}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded border bg-white hover:bg-gray-50 text-primary shadow-sm whitespace-nowrap"
            >
              <FileText className="w-4 h-4 mr-1" />
              Release Notes
            </a>
            <button
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded border bg-white hover:bg-gray-50 text-gray-900 shadow-sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Teams</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {release.teams && release.teams.length > 0 ? (
                  release.teams.map((team: any) => (
                    <Badge key={team.id} variant="secondary" className="text-xs">
                      {team.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No teams</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className={`text-sm ${isUserMember() ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}>Members</p>
              <p className={`text-lg font-semibold ${isUserMember() ? 'text-blue-600' : ''}`}>{readyMembers}/{totalMembers}</p>
            </div>
            <div className="space-y-1">
              <p className={`text-sm ${isUserDRI() ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}>Features</p>
              <p className={`text-lg font-semibold ${isUserDRI() ? 'text-blue-600' : ''}`}>{readyFeatures}/{featureCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Platform Update</p>
              <Badge variant={release.platform_update ? "default" : "secondary"}>
                {release.platform_update ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Specs Update</p>
              <Badge variant={release.config_update ? "default" : "secondary"}>
                {release.config_update ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Features Card */}
        <Card className="w-full md:w-1/2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center"><FileText className="h-4 w-4 mr-2" />Features</CardTitle>
            <AddFeatureDialog 
              releaseId={release.id} 
              releaseName={release.name} 
              onFeatureAdded={() => onReleaseUpdated(undefined)} 
            />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              {features.length === 0 ? (
                <p className="text-sm text-muted-foreground">No features added yet.</p>
              ) : (
                [...features]
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((feature: any) => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      user={user}
                      memberId={memberId}
                      updatingFeature={updatingFeature}
                      handleFeatureReadyChange={handleFeatureReadyChange}
                      onFeatureUpdated={() => onReleaseUpdated(undefined)}
                      releaseName={release.name}
                    />
                  ))
              )}
            </div>
          </CardContent>
        </Card>
        {/* Teams Card */}
        <Card className="w-full md:w-1/2">
          <CardHeader>
            <CardTitle className="text-base flex items-center"><Users className="h-4 w-4 mr-2" />Team Members</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              {/* Flat list of unique members */}
              {allMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members assigned to this release.</p>
              ) : (
                allMembers.map((member: any) => {
                  // Find all teams this member belongs to
                  const memberTeams = release.teams.filter((team: any) =>
                    team.members.some((m: any) => m.id === member.id)
                  );
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-2 rounded border ${user && member.email === user.email ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="text-sm font-medium">{member.nickname || member.full_name}</p>
                        </div>
                      </div>
                      {/* Team badges (center) */}
                      <div className="flex flex-row flex-wrap gap-1 justify-center items-center">
                        {memberTeams.map((team: any) => (
                          <Badge key={team.id} variant="secondary" className="text-xs">
                            {team.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Show 'Ready' label to the left of the checkbox */}
                        <label htmlFor={`member-ready-${member.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">Ready</label>
                        <Checkbox
                          checked={member.is_ready}
                          onCheckedChange={(checked) =>
                            updateMemberReady(release.id, member.id, checked as boolean)
                          }
                          id={`member-ready-${member.id}`}
                        />
                        {/* Only show Not Ready/Ready badge if not the logged in user */}
                        {!(user && member.email === user.email) && (
                          <Badge variant={member.is_ready ? "default" : "secondary"} className="text-xs">
                            {member.is_ready ? "Ready" : "Not Ready"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <FeatureReadyDialog
        open={readyDialogOpen}
        onOpenChange={handleReadyDialogCancel}
        featureName={selectedFeature?.name || ""}
        onConfirm={handleReadyDialogConfirm}
        loading={updatingFeature}
      />
      <CreateReleaseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialRelease={release}
        onReleaseSaved={onReleaseUpdated}
        isEdit={true}
      />
    </div>
  );
} 