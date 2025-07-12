"use client";

import { useState } from "react";
import { CreateReleaseDialog } from "./CreateReleaseDialog";
import { ReleaseSummaryCard } from "./ReleaseSummaryCard";

export default function ReleaseDetailCard({ release, onReleaseUpdated, allReleases = [] } : {
  release: any,
  onReleaseUpdated: () => void,
  allReleases?: Array<{
    id: string;
    name: string;
    target_date: string;
    is_cancelled?: boolean;
    is_deployed?: boolean;
  }>,
}) {
  // const [readyDialogOpen, setReadyDialogOpen] = useState(false);
  // const [selectedFeature, setSelectedFeature] = useState<any>(null);

  // const [archiving, setArchiving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // const [expanded, setExpanded] = useState(true); // Always expanded for detail page
  // const [expandedReleaseDetail, setExpandedReleaseDetail] = useState<any>(null);
  // const [detailLoading, setDetailLoading] = useState(false);
  // const [detailError, setDetailError] = useState<string | null>(null);

  // Since we're already passing the complete release data, we don't need to fetch it again
  // The release prop already contains all the necessary data

  // if (detailLoading) {
  //   return <div className="flex items-center justify-center py-12"><LoadingSpinner text="Loading release details..." /></div>;
  // }
  // if (detailError) {
  //   return <div className="flex items-center justify-center py-12 text-red-600">{detailError}</div>;
  // }

  // const handleArchiveChange = async (checked: boolean) => {
  //   setArchiving(true);
  //   setIsArchived(checked);
  //   const supabase = createClient();
  //   const { error } = await supabase
  //     .from("releases")
  //     .update({ is_archived: checked })
  //     .eq("id", release.id);
  //   if (error) {
  //     console.error('Failed to update is_archived:', error);
  //     // Optionally, show a toast or error message to the user
  //   } else {
  //     // console.log('is_archived updated successfully');
  //   }
  //   setArchiving(false);
  //   // Optionally, handle error or refresh data
  // };

  // Allow DRI or release manager to mark feature ready
  // const handleFeatureReadyChange = async (feature: any, isReady: boolean) => {
  //   if (!user) return;
  //   if (!feature.dri_member || (memberId !== feature.dri_member.id && !is_release_manager)) {
  //     return;
  //   }
  //   await updateFeatureReady(feature.id, isReady, "");
  // };

  // const updateFeatureReady = async (featureId: string, isReady: boolean, comments: string) => {
  //   setUpdatingFeature(true);
  //   const supabase = createClient();
  //   const { error } = await supabase
  //     .from("features")
  //     .update({
  //       is_ready: isReady,
  //       comments: comments || null,
  //     })
  //     .eq("id", featureId);
  //   if (error) {
  //     console.error('Error updating feature ready state:', error);
  //   } else {
  //     setFeatures((prev: any[]) =>
  //       prev.map((f: any) =>
  //         f.id === featureId ? { ...f, is_ready: isReady, comments } : f
  //       )
  //     );
  //     // Update summary counts
  //     setReadyFeatures((prev: number) => prev + (isReady ? 1 : -1));
  //   }
  //   setUpdatingFeature(false);
  // };

  // const handleReadyDialogConfirm = async (comments: string) => {
  //   if (selectedFeature) {
  //     await updateFeatureReady(selectedFeature.id, true, comments);
  //     // Log activity: DRI marked feature ready
  //     if (user?.id) {
  //       const supabase = createClient();
  //       console.log("Logging feature_ready activity for release_id:", release.id, "feature_id:", selectedFeature.id, "release name:", release.name, "feature name:", selectedFeature.name);
  //       const { error: activityError } = await supabase.from("activity_log").insert({
  //         release_id: release.id,
  //         feature_id: selectedFeature.id,
  //         member_id: memberId,
  //         project_id: release.project?.id || "",
  //         activity_type: "feature_ready",
  //         activity_details: { comments, releaseName: release.name, featureName: selectedFeature.name },
  //       });
  //       if (activityError) {
  //         console.error("Failed to log feature ready activity:", activityError);
  //       } else {
  //         // console.log("Successfully logged feature ready activity");
  //       }
  //     }
  //     setReadyDialogOpen(false);
  //     setSelectedFeature(null);
  //   }
  // };

  // const handleReadyDialogCancel = () => {
  //   setReadyDialogOpen(false);
  //   setSelectedFeature(null);
  // };

  // const updateMemberReady = async (releaseId: string, memberId: string, isReady: boolean) => {
  //   const supabase = createClient();
  //   let memberProjectId = null;
  //   if (release && release.teams) {
  //     for (const team of release.teams) {
  //       const member = team.members?.find((m: any) => m.id === memberId);
  //       if (member) {
  //         memberProjectId = member.project_id;
  //         break;
  //       }
  //     }
  //   }
  //   if (!memberProjectId && release?.project?.id) {
  //     memberProjectId = release.project.id;
  //   }
  //   const { error } = await supabase
  //     .from("member_release_state")
  //     .upsert({
  //       release_id: releaseId,
  //       member_id: memberId,
  //       project_id: memberProjectId,
  //       is_ready: isReady,
  //     });
  //   if (error) {
  //     console.error("Error updating member ready state:", error);
  //   } else {
  //     setAllMembers((prev: any[]) =>
  //       prev.map((m: any) =>
  //         m.id === memberId ? { ...m, is_ready: isReady } : m
  //       )
  //     );
  //     // Log activity: member ready state change
  //     if (user?.id) {
  //       console.log("Logging member_ready activity for release_id:", releaseId, "member_id:", memberId, "release name:", release.name);
  //       const { error: activityError } = await supabase.from("activity_log").insert({
  //         release_id: releaseId,
  //         member_id: memberId,
  //         project_id: memberProjectId,
  //         activity_type: "member_ready",
  //         activity_details: { isReady, releaseName: release.name },
  //       });
  //       if (activityError) {
  //         console.error("Failed to log member ready activity:", activityError);
  //       } else {
  //         // console.log("Successfully logged member ready activity");
  //       }
  //     }
  //   }
  // };

  // const handleStateChange = async (newState: string) => {
  //   if (release.state === newState) return;
  //   const supabase = createClient();
  //   console.log("Logging activity for release_id:", release.id, "release name:", release.name);
  //   const { error } = await supabase
  //     .from("releases")
  //     .update({ state: newState })
  //     .eq("id", release.id);
  //   if (!error) {
  //     // Log activity: release state change
  //     if (user?.id) {
  //       const supabase = createClient();
  //       const { error: activityError } = await supabase.from("activity_log").insert({
  //         release_id: release.id,
  //         member_id: memberId,
  //         project_id: release.project?.id || "",
  //         activity_type: "release_state_change",
  //         activity_details: { oldState: release.state, newState, releaseName: release.name },
  //       });
  //       if (activityError) {
  //         console.error("Failed to log release state change activity:", activityError);
  //       } else {
  //         // console.log("Successfully logged release state change activity");
  //       }
  //     }
  //     // Optionally refresh or notify parent
  //     onReleaseUpdated?.();
  //   }
  // };

  // // Check if the current user is a DRI on any features
  // const isUserDRI = () => {
  //   if (!memberId || !release.features) return false;
  //   return release.features.some((feature: any) => feature.dri_member_id === memberId);
  // };
  // // Check if the current user is a member of any teams in this release
  // const isUserMember = () => {
  //   if (!memberId || !release.teams) return false;
  //   return release.teams.some((team: any) =>
  //     team.members?.some((member: any) => member.id === memberId)
  //   );
  // };

  return (
    <div className="flex flex-col">
      <ReleaseSummaryCard
        release={release}
        onReleaseUpdated={() => onReleaseUpdated?.()}
        collapsible={false}
        initialExpanded={true}
        allReleases={allReleases}
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