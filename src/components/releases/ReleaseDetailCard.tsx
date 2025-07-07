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

  useEffect(() => {
    setIsArchived(release.is_archived);
  }, [release.is_archived]);

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
    if (!user || !feature.dri_member || user.id !== feature.dri_member.id) {
      // console.log("User is not the DRI for this feature");
      return;
    }

    if (isReady) {
      // Open dialog to collect comments
      setSelectedFeature(feature);
      setReadyDialogOpen(true);
    } else {
      // Directly update to false without comments
      await updateFeatureReady(feature.id, false, "");
    }
  };

  const updateFeatureReady = async (featureId: string, isReady: boolean, comments: string) => {
    setUpdatingFeature(true);
    const supabase = createClient();
    
    await supabase
      .from("features")
      .update({
        is_ready: isReady,
        comments: comments || null,
      })
      .eq("id", featureId);
    // Trigger a page refresh to update the data
    window.location.reload();
    setUpdatingFeature(false);
  };

  const handleReadyDialogConfirm = async (comments: string) => {
    if (selectedFeature) {
      await updateFeatureReady(selectedFeature.id, true, comments);
      // Log activity: DRI marked feature ready
      const supabase = createClient();
      const { error: activityError } = await supabase.from("activity_log").insert({
        release_id: release.id,
        feature_id: selectedFeature.id,
        member_id: user?.id,
        activity_type: "feature_ready",
        activity_details: { comments },
      });
      if (activityError) {
        console.error("Failed to log feature ready activity:", activityError);
      } else {
        // console.log("Successfully logged feature ready activity");
      }
      setReadyDialogOpen(false);
      setSelectedFeature(null);
    }
  };

  const handleReadyDialogCancel = () => {
    setReadyDialogOpen(false);
    setSelectedFeature(null);
  };

  // Instrument member ready change
  const handleMemberReadyChange = async (releaseId: string, memberId: string, isReady: boolean) => {
    // Log activity: member signals ready
    const supabase = createClient();
    const { error: activityError } = await supabase.from("activity_log").insert({
      release_id: releaseId,
      member_id: memberId,
      activity_type: "member_ready",
      activity_details: { isReady },
    });
    if (activityError) {
      console.error("Failed to log member ready activity:", activityError);
    } else {
      // console.log("Successfully logged member ready activity");
    }
    if (onMemberReadyChange) {
      onMemberReadyChange(releaseId, memberId, isReady);
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
      const { error: activityError } = await supabase.from("activity_log").insert({
        release_id: release.id,
        member_id: user?.id,
        activity_type: "release_state_change",
        activity_details: { oldState: release.state, newState },
      });
      if (activityError) {
        console.error("Failed to log release state change activity:", activityError);
      } else {
        // console.log("Successfully logged release state change activity");
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
              <CardTitle className="truncate text-lg">{release.name}</CardTitle>
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
              <p className={`text-lg font-semibold ${isUserMember() ? 'text-blue-600' : ''}`}>{release.ready_members}/{release.total_members}</p>
            </div>
            <div className="space-y-1">
              <p className={`text-sm ${isUserDRI() ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}>Features</p>
              <p className={`text-lg font-semibold ${isUserDRI() ? 'text-blue-600' : ''}`}>{release.ready_features}/{release.feature_count}</p>
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
              {release.features.length === 0 ? (
                <p className="text-sm text-muted-foreground">No features added yet.</p>
              ) : (
                release.features.map((feature: any) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    user={user}
                    updatingFeature={updatingFeature}
                    handleFeatureReadyChange={handleFeatureReadyChange}
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
            <div className="space-y-4">
              {release.teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No teams assigned to this release.</p>
              ) : (
                release.teams.map((team: any) => (
                  <div key={team.id} className="border rounded-lg p-4">
                    <h5 className="font-medium text-sm mb-2">{team.name}</h5>
                    {team.description && (
                      <p className="text-xs text-muted-foreground mb-3">{team.description}</p>
                    )}
                    <div className="space-y-2">
                      {team.members.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No members in this team.</p>
                      ) : (
                        team.members.map((member: any) => (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between p-2 rounded border ${user && member.email === user.email ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                          >
                            <div className="flex items-center space-x-3">
                              {onMemberReadyChange && (
                                <Checkbox
                                  checked={member.is_ready}
                                  onCheckedChange={(checked) => 
                                    handleMemberReadyChange(release.id, member.id, checked as boolean)
                                  }
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium">{member.full_name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            <Badge variant={member.is_ready ? "default" : "secondary"} className="text-xs">
                              {member.is_ready ? "Ready" : "Not Ready"}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
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