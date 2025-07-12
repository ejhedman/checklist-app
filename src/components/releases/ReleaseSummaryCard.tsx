import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, FileText, ChevronDown, ChevronUp, Pencil, Trash2, Check, CheckSquare, X } from "lucide-react";
import MiniCard from "./MiniCard";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { StateBadge } from "@/components/ui/state-icons";
import { getStatePaleBackgroundColor } from "@/lib/state-colors";
import { useRouter } from "next/navigation";
import { ReleaseDetailBottomContent } from "./ReleaseDetailBottomContent";
import { CreateReleaseDialog } from "./CreateReleaseDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


export interface ReleaseSummaryCardProps {
  release: {
    id: string;
    name: string;
    target_date: string;
    state: string;
    platform_update: boolean;
    config_update: boolean;
    team_count: number;
    feature_count: number;
    ready_features: number;
    created_at: string;
    total_members: number;
    ready_members: number;
    is_archived?: boolean;
    is_ready?: boolean;
    is_deployed?: boolean;
    is_cancelled?: boolean;
    targets?: string[];
    project?: {
      id: string;
      name: string;
    };
    release_teams?: Array<{
      team: {
        id: string;
        name: string;
        description: string;
        team_members: Array<{
          member: {
            id: string;
            full_name: string;
            email: string;
          };
        }>;
      };
    }>;
    features?: Array<{
      id: string;
      name: string;
      description: string;
      jira_ticket: string;
      is_platform: boolean;
      is_config: boolean;
      is_ready: boolean;
      comments: string;
      dri_member_id: string;
      dri_member: {
        id: string;
        full_name: string;
        email: string;
      };
    }>;
  };
  onReleaseUpdated?: () => void;
  initialExpanded?: boolean;
  collapsible?: boolean;
  allReleases?: Array<{
    id: string;
    name: string;
    target_date: string;
    is_cancelled?: boolean;
    is_deployed?: boolean;
  }>;
}

// Helper to calculate days until target date
function getDaysUntil(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper to calculate dynamic state based on today's date and database fields
function calculateDynamicState(
  release: {
    id: string;
    target_date: string;
    is_cancelled?: boolean;
    is_deployed?: boolean;
  },
  allReleases: Array<{
    id: string;
    target_date: string;
    is_cancelled?: boolean;
    is_deployed?: boolean;
  }> = []
): string {
  // If cancelled, state is "cancelled"
  if (release.is_cancelled) {
    return "cancelled";
  }
  
  // If deployed, state is "deployed"
  if (release.is_deployed) {
    return "deployed";
  }
  
  // Calculate days until target date
  const daysUntil = getDaysUntil(release.target_date);
  
  // If past due (before today's date)
  if (daysUntil < 0) {
    return "past_due";
  }
  
  // Find the next release on or after today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureReleases = allReleases
    .filter(r => !r.is_cancelled && !r.is_deployed)
    .filter(r => {
      const [year, month, day] = r.target_date.split('-').map(Number);
      const releaseDate = new Date(year, month - 1, day);
      releaseDate.setHours(0, 0, 0, 0);
      return releaseDate >= today;
    })
    .sort((a, b) => {
      const [yearA, monthA, dayA] = a.target_date.split('-').map(Number);
      const [yearB, monthB, dayB] = b.target_date.split('-').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });
  
  // If this is the next release (first in sorted list)
  if (futureReleases.length > 0 && futureReleases[0].id === release.id) {
    return "next";
  }
  
  // Otherwise, it's pending
  return "pending";
}

export const ReleaseSummaryCard: React.FC<ReleaseSummaryCardProps> = ({
  release,
  onReleaseUpdated,
  initialExpanded = false,
  collapsible = false,
  allReleases = [],
}) => {
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [isArchived, setIsArchived] = useState(release.is_archived);
  const [archiving, setArchiving] = useState(false);
  const { user, memberId, selectedProject, is_release_manager } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState(collapsible ? initialExpanded : true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedReleaseDetail, setExpandedReleaseDetail] = useState<any>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [updatingFeature, setUpdatingFeature] = useState(false);
  const [features, setFeatures] = useState(release.features || []);
  const [uniqueMembers, setUniqueMembers] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  // Local state to persist the latest summary counts
  const [summaryReadyMembers, setSummaryReadyMembers] = useState(release.ready_members);
  const [summaryTotalMembers, setSummaryTotalMembers] = useState(release.total_members);
  const [summaryReadyFeatures, setSummaryReadyFeatures] = useState(release.ready_features);
  const [summaryFeatureCount, setSummaryFeatureCount] = useState(release.feature_count);
  // Calculate dynamic state instead of using database state
  const [dynamicState, setDynamicState] = useState(() => 
    calculateDynamicState(release, allReleases)
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  


  // Centralized function to calculate release ready state
  // const calculateReleaseReadyState = (features: any[], members: any[]) => {
  //   const allFeaturesReady = features.length > 0 && features.every(f => f.is_ready);
  //   const allMembersReady = members.length > 0 && members.every(m => m.is_ready);
  //   return allFeaturesReady && allMembersReady;
  // };

  // Update dynamic state when release or allReleases changes
  useEffect(() => {
    const newState = calculateDynamicState(release, allReleases);
    setDynamicState(newState);
  }, [release, allReleases]);

  useEffect(() => {
    setIsArchived(release.is_archived);
  }, [release.is_archived]);



  useEffect(() => {
    const fetchTeams = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("release_teams")
        .select("teams(name)")
        .eq("release_id", release.id);
      if (!error && data) {
        setTeamNames(data.map((row: any) => row.teams?.name).filter(Boolean));
      }
    };
    fetchTeams();
  }, [release.id]);

  useEffect(() => {
    if (expanded && !expandedReleaseDetail && selectedProject && user) {
      setDetailLoading(true);
      setDetailError(null);
      const fetchDetail = async () => {
        const supabase = createClient();
        const { data, error: supabaseError } = await supabase
          .from("releases")
          .select(`
            id,
            name,
            target_date,
            platform_update,
            config_update,
            is_archived,
            is_deployed,
            is_cancelled,
            targets,
            created_at,
            project_id,
            projects (
              id,
              name
            ),
            release_teams (
              team:teams (
                id,
                name,
                description,
                team_members (
                  member:members (
                    id,
                    full_name,
                    email,
                    nickname,
                    project_id
                  )
                )
              )
            ),
            member_release_state (
              member_id,
              is_ready
            ),
            features (
              id,
              name,
              description,
              jira_ticket,
              is_platform,
              is_config,
              is_ready,
              comments,
              dri_member_id,
              dri_member:members!dri_member_id (
                id,
                full_name,
                email,
                nickname
              )
            )
          `)
          .eq("id", release.id)
          .eq("project_id", selectedProject.id)
          .order("created_at", { foreignTable: "features", ascending: true })
          .single();
        if (supabaseError || !data) {
          setDetailError("Failed to load release details");
          setDetailLoading(false);
          return;
        }
        // Calculate total_members and ready_members (distinct by member.id)
        const allMembers: any[] = [];
        if (data.release_teams) {
          data.release_teams.forEach((rt: any) => {
            if (rt.team && rt.team.team_members) {
              const members = Array.isArray(rt.team.team_members)
                ? rt.team.team_members
                : [rt.team.team_members];
              members.forEach((tm: any) => {
                allMembers.push(tm.member ? tm.member : tm);
              });
            }
          });
        }
        // Deduplicate by member.id
        const uniqueMembersMap = new Map();
        allMembers.forEach((member) => {
          uniqueMembersMap.set(member.id, member);
        });
        const uniqueMembers = Array.from(uniqueMembersMap.values()).map(member => {
          const memberReadyState = data.member_release_state?.find((mrs: any) => mrs.member_id === member.id);
          return {
            ...member,
            is_ready: memberReadyState?.is_ready || false,
          };
        });
        const total_members = uniqueMembers.length;
        const ready_members = uniqueMembers.filter((member) => {
          return member.is_ready;
        }).length;
        // Transform the data to match the card props
        const transformedRelease = {
          ...data,
          team_count: data.release_teams?.length || 0,
          feature_count: data.features?.length || 0,
          ready_features: data.features?.filter((f: any) => f.is_ready)?.length || 0,
          features: data.features?.map((feature: any) => ({
            ...feature,
            dri_member: Array.isArray(feature.dri_member)
              ? feature.dri_member[0]
              : feature.dri_member,
          })) || [],
          teams: data.release_teams?.map((rt: any) => ({
            id: rt.team.id,
            name: rt.team.name,
            description: rt.team.description,
            members: (Array.isArray(rt.team.team_members)
              ? rt.team.team_members
              : (rt.team.team_members ? [rt.team.team_members] : [])
            ).map((tm: any) => {
              const memberReadyState = data.member_release_state?.find((mrs: any) => mrs.member_id === tm.member.id);
              return {
                id: tm.member.id,
                full_name: tm.member.full_name,
                email: tm.member.email,
                nickname: tm.member.nickname,
                project_id: tm.member.project_id,
                is_ready: memberReadyState?.is_ready || false,
              };
            }) || [],
          })) || [],
          total_members,
          ready_members,
          project: data.projects,
        };
        setExpandedReleaseDetail(transformedRelease);
        setFeatures(transformedRelease.features || []);
        setUniqueMembers(uniqueMembers);
        setDetailLoading(false);
      };
      fetchDetail();
    }
    if (!expanded) {
      setExpandedReleaseDetail(null);
      setDetailLoading(false);
      setDetailError(null);
    }
  }, [expanded, selectedProject, user, release.id, expandedReleaseDetail]);

  // Keep summary counts in sync with expandedReleaseDetail
  useEffect(() => {
    if (expandedReleaseDetail) {
      setSummaryReadyMembers(expandedReleaseDetail.ready_members);
      setSummaryTotalMembers(expandedReleaseDetail.total_members);
      setSummaryReadyFeatures(expandedReleaseDetail.ready_features);
      setSummaryFeatureCount(expandedReleaseDetail.feature_count);
    }
  }, [expandedReleaseDetail]);

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
      // Revert the state if update failed
      setIsArchived(!checked);
    } else {
      // Call the callback to refresh the parent component
      onReleaseUpdated?.();
    }
    setArchiving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("releases")
        .delete()
        .eq("id", release.id);

      if (error) {
        console.error('Failed to delete release:', error);
        return;
      }

      setDeleteDialogOpen(false);
      // Call the callback to refresh the parent component
      onReleaseUpdated?.();
    } catch (error) {
      console.error('Error deleting release:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeployToggle = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("releases")
      .update({ is_deployed: true })
      .eq("id", release.id);

    if (error) {
      console.error('Failed to update deployment status:', error);
      return;
    }

    // Call the callback to refresh the parent component
    onReleaseUpdated?.();
  };

  const handleCancelRelease = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("releases")
      .update({ is_cancelled: true })
      .eq("id", release.id);

    if (error) {
      console.error('Failed to cancel release:', error);
      return;
    }

    // Call the callback to refresh the parent component
    onReleaseUpdated?.();
  };

  // Check if the current user is a DRI on any features
  const isUserDRI = () => {
    if (!memberId || !release.features) return false;
    return release.features.some(feature => 
      feature.dri_member_id === memberId
    );
  };

  // Check if the current user is a member of any teams in this release
  const isUserMember = () => {
    if (!memberId || !release.release_teams) return false;
    return release.release_teams.some(rt => 
      rt.team?.team_members?.some(tm => 
        tm.member?.id === memberId
      )
    );
  };

  const handleFeatureReadyChange = async (feature: any, isReady: boolean) => {
    if (!user) {
      console.log('No user, cannot mark ready');
      return;
    }
    
    // Allow DRI or release manager
    // For DRI: must have a DRI assigned and be the DRI
    // For release manager: can mark ready regardless of DRI status
    if (memberId && feature.dri_member && memberId === feature.dri_member.id) {
      // User is the DRI - allow
      console.log('User is DRI, marking feature ready', { featureId: feature.id, isReady });
    } else if (is_release_manager) {
      // User is release manager - allow regardless of DRI status
      console.log('User is release manager, marking feature ready', { featureId: feature.id, isReady });
    } else {
      console.log('Not DRI or release manager, cannot mark ready', { memberId, dri: feature.dri_member?.id, is_release_manager });
      return;
    }
    
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
      // Update local features state
      const updatedFeatures = features.map((f: any) =>
        f.id === featureId ? { ...f, is_ready: isReady, comments } : f
      );
      setFeatures(updatedFeatures);
      // Recalculate summary counts
      const readyFeatures = updatedFeatures.filter((f: any) => f.is_ready).length;
      setSummaryReadyFeatures(readyFeatures);
      setSummaryFeatureCount(updatedFeatures.length);
      
      // Update expandedReleaseDetail
      if (expandedReleaseDetail) {
        const updatedDetail = {
          ...expandedReleaseDetail,
          ready_features: readyFeatures,
          feature_count: updatedFeatures.length,
          features: updatedFeatures,
        };
        setExpandedReleaseDetail(updatedDetail);
      }
      
      // Update release ready state after feature state change
      updateReleaseReadyState();
    }
    setUpdatingFeature(false);
  };

  const updateMemberReady = async (releaseId: string, memberId: string, isReady: boolean) => {
    const supabase = createClient();
    let memberProjectId = null;
    if (expandedReleaseDetail && expandedReleaseDetail.teams) {
      for (const team of expandedReleaseDetail.teams) {
        const member = team.members?.find((m: any) => m.id === memberId);
        if (member) {
          memberProjectId = member.project_id;
          break;
        }
      }
    }
    if (!memberProjectId && expandedReleaseDetail?.project?.id) {
      memberProjectId = expandedReleaseDetail.project.id;
    }
    const { error } = await supabase
      .from("member_release_state")
      .upsert({
        release_id: releaseId,
        member_id: memberId,
        project_id: memberProjectId,
        is_ready: isReady,
      });
    if (error) {
      console.error("Error updating member ready state:", error);
    } else {
      // Update the uniqueMembers state
      const updatedUniqueMembers = uniqueMembers.map((m: any) =>
        m.id === memberId ? { ...m, is_ready: isReady } : m
      );
      setUniqueMembers(updatedUniqueMembers);
      // Recalculate summary counts
      const readyMembers = updatedUniqueMembers.filter((m: any) => m.is_ready).length;
      setSummaryReadyMembers(readyMembers);
      setSummaryTotalMembers(updatedUniqueMembers.length);
      
      // Update expandedReleaseDetail
      if (expandedReleaseDetail) {
        const updatedDetail = {
          ...expandedReleaseDetail,
          ready_members: readyMembers,
          total_members: updatedUniqueMembers.length,
          teams: expandedReleaseDetail.teams,
        };
        setExpandedReleaseDetail(updatedDetail);
      }
      
      // Update release ready state after member state change
      updateReleaseReadyState();
    }
  };

  // Function to check and automatically update release state based on ready status
  // const checkAndUpdateReleaseState = async (releaseDetail: any, members: any[]) => {
  //   const totalFeatures = releaseDetail.feature_count;
  //   const readyFeatures = releaseDetail.ready_features;
  //   const totalMembers = members.length;
  //   const readyMembers = members.filter((m: any) => m.is_ready).length;
    
  //   // Determine if all features and members are ready
  //   const allFeaturesReady = totalFeatures > 0 && readyFeatures === totalFeatures;
  //   const allMembersReady = totalMembers > 0 && readyMembers === totalMembers;
    
  //   // Calculate if the release is ready (all features and members ready)
  //   const isReleaseReady = allFeaturesReady && allMembersReady;
    
  //   // Only update if the is_ready status actually changed
  //   if (isReleaseReady !== releaseDetail.is_ready) {
  //     const supabase = createClient();
  //     const { error } = await supabase
  //       .from("releases")
  //       .update({ is_ready: isReleaseReady })
  //       .eq("id", release.id);
      
  //     if (error) {
  //       console.error('Error updating release is_ready:', error);
  //     } else {
  //       // Update the local state
  //       setExpandedReleaseDetail((prev: any) => prev ? { ...prev, is_ready: isReleaseReady } : null);
        
  //       // Log activity for is_ready change
  //       if (user?.id) {
  //         const { error: activityError } = await supabase.from("activity_log").insert({
  //           release_id: release.id,
  //           member_id: memberId,
  //           project_id: releaseDetail.project?.id || "",
  //           activity_type: "release_ready_change",
  //           activity_details: { 
  //             oldIsReady: releaseDetail.is_ready, 
  //             newIsReady: isReleaseReady,
  //             reason: "automatic_ready_change",
  //             readyFeatures,
  //             totalFeatures,
  //             readyMembers,
  //             totalMembers,
  //             releaseName: releaseDetail.name
  //           },
  //         });
  //         if (activityError) {
  //           console.error("Failed to log release ready change activity:", activityError);
  //         }
  //       }
  //     }
  //   }
  // };

  // Handle team changes locally without triggering full refresh
  const handleTeamsChanged = async () => {
    // Update the team names display by fetching the current teams for this release
    const supabase = createClient();
    const { data, error } = await supabase
      .from("release_teams")
      .select("teams(name)")
      .eq("release_id", release.id);
    
    if (!error && data) {
      const newTeamNames = data.map((row: any) => row.teams?.name).filter(Boolean);
      setTeamNames(newTeamNames);
    }
    
    // If we have expanded release detail, we should also update it
    if (expandedReleaseDetail) {
      // Force a refresh of the expanded detail to get the new team information
      setExpandedReleaseDetail(null);
    }
  };

  // Handle feature changes locally without triggering full refresh
  const handleFeatureChanged = (newFeature: any) => {
    // Add the new feature to the local features state
    setFeatures((prev: any[]) => [...prev, newFeature]);
    
    // Update the feature counts in the release summary
    if (expandedReleaseDetail) {
      const updatedDetail = {
        ...expandedReleaseDetail,
        feature_count: expandedReleaseDetail.feature_count + 1,
        ready_features: expandedReleaseDetail.ready_features + (newFeature.is_ready ? 1 : 0)
      };
      setExpandedReleaseDetail(updatedDetail);
      
      // Trigger the new ready state update system
      updateReleaseReadyState();
    }
  };

  // Handle feature edits locally without triggering full refresh
  const handleFeatureEdited = (updatedFeature: any) => {
    // Update the feature in the local features state
    setFeatures((prev: any[]) => 
      prev.map((f: any) => 
        f.id === updatedFeature.id ? { ...f, ...updatedFeature } : f
      )
    );
    
    // Update the feature counts in the release summary if ready status changed
    if (expandedReleaseDetail) {
      const oldFeature = features.find((f: any) => f.id === updatedFeature.id);
      if (oldFeature && oldFeature.is_ready !== updatedFeature.is_ready) {
        const readyFeaturesChange = updatedFeature.is_ready ? 1 : -1;
        const updatedDetail = {
          ...expandedReleaseDetail,
          ready_features: expandedReleaseDetail.ready_features + readyFeaturesChange
        };
        setExpandedReleaseDetail(updatedDetail);
        
        // Trigger the new ready state update system
        updateReleaseReadyState();
      }
    }
  };



  // Lock to prevent duplicate ready state updates/logs
  const isUpdatingReleaseReadyState = useRef(false);
  // Update release ready state in database based on child component states
  const updateReleaseReadyState = async () => {
    if (isUpdatingReleaseReadyState.current) return;
    isUpdatingReleaseReadyState.current = true;
    // Calculate release ready state based on current local state
    // Use the current features and members arrays to calculate the state
    const currentFeatures = features || [];
    const currentMembers = uniqueMembers || [];
    
    // Calculate if all features are ready
    const allFeaturesReady = currentFeatures.length > 0 && currentFeatures.every(f => f.is_ready);
    
    // Calculate if all members are ready
    const allMembersReady = currentMembers.length > 0 && currentMembers.every(m => m.is_ready);
    
    // Calculate overall release ready state (both features and teams must be ready)
    const isReleaseReady = allFeaturesReady && allMembersReady;
    
    // Only update if the state actually changed
    const currentIsReady = expandedReleaseDetail?.is_ready ?? release.is_ready ?? false;
    if (isReleaseReady !== currentIsReady) {
      const supabase = createClient();
      const { error } = await supabase
        .from("releases")
        .update({ is_ready: isReleaseReady })
        .eq("id", release.id);
      
      if (error) {
        console.error('Error updating release is_ready:', error);
      } else {
        // Update local state immediately
        if (expandedReleaseDetail) {
          setExpandedReleaseDetail((prev: any) => prev ? { ...prev, is_ready: isReleaseReady } : null);
        }
        
        // Also update the release prop locally for immediate UI update
        // This ensures the badge updates immediately
        // if (release.is_ready !== isReleaseReady) {
        //   // Create a new release object with updated is_ready
        //   // const updatedRelease = { ...release, is_ready: isReleaseReady };
        //   // Force a re-render by updating the local state
        //   // Note: This is a workaround since we can't directly modify the prop
        //   // The parent component should refresh the data after this update
        // }
        
        // Log activity for is_ready change
        if (user?.id) {
          const { error: activityError } = await supabase.from("activity_log").insert({
            release_id: release.id,
            member_id: memberId,
            project_id: expandedReleaseDetail?.project?.id || release.project?.id || "",
            activity_type: "release_ready_change",
            activity_details: { 
              oldIsReady: currentIsReady, 
              newIsReady: isReleaseReady,
              reason: "local_state_calculation",
              featuresReady: allFeaturesReady,
              teamsReady: allMembersReady,
              releaseName: expandedReleaseDetail?.name || release.name
            },
          });
          if (activityError) {
            console.error("Failed to log release ready change activity:", activityError);
          }
        }
      }
    }
    isUpdatingReleaseReadyState.current = false;
  };

  // Sync local state with database state when expanded
  useEffect(() => {
    if (expanded && expandedReleaseDetail) {
      // Ensure the local is_ready state matches the database state
      const databaseIsReady = release.is_ready ?? false;
      if (expandedReleaseDetail.is_ready !== databaseIsReady) {
        setExpandedReleaseDetail((prev: any) => prev ? { ...prev, is_ready: databaseIsReady } : null);
      }
    }
  }, [expanded, expandedReleaseDetail, release.is_ready]);

  // Helper to calculate days until target date
  const days = getDaysUntil(release.target_date);
  const isPast = days < 0;

  // Get the current release ready state for display (calculate from current local state)
  const getCurrentReleaseReadyState = () => {
    // Calculate based on current local state for immediate updates
    const currentFeatures = features || [];
    const currentMembers = uniqueMembers || [];
    
    const allFeaturesReady = currentFeatures.length > 0 && currentFeatures.every(f => f.is_ready);
    const allMembersReady = currentMembers.length > 0 && currentMembers.every(m => m.is_ready);
    
    // Use calculated state if we have local data, otherwise fall back to database state
    if (currentFeatures.length > 0 || currentMembers.length > 0) {
      return allFeaturesReady && allMembersReady;
    }
    
    // Fall back to database state
    return expandedReleaseDetail?.is_ready ?? release.is_ready ?? false;
  };

  return (
    <>
      <Card
        className={
          `${expanded
            ? 'rounded-none rounded-t-lg border-b-0 shadow-none'
            : 'hover:shadow-md transition-shadow rounded-lg shadow-sm'
          } m-0`
        }
        onClick={
          collapsible && !expanded
            ? () => setExpanded(true)
            : undefined
        }
        style={{ cursor: collapsible && !expanded ? 'pointer' : 'default' }}
      >
        <CardHeader className={`flex flex-row items-center justify-between px-4 py-3 rounded-t-lg ${collapsible && expanded ? '' : collapsible ? 'border-b border-border' : ''} ${getStatePaleBackgroundColor(dynamicState as any, release.is_archived)}`}>
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center flex-1 min-w-0 rounded px-1 py-0.5 transition-colors">
              <div className="flex items-center space-x-3 min-w-0">
                {collapsible && (
                  <button
                    type="button"
                    aria-label={expanded ? "Collapse details" : "Expand details"}
                    title={expanded ? "Collapse details" : "Expand details"}
                    className="p-2 rounded hover:bg-gray-100 transition-colors"
                    onClick={e => {
                      e.stopPropagation();
                      setExpanded(e => !e);
                    }}
                  >
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                )}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold truncate">
                    {release.project?.name ? `${release.project.name}: ` : ''}{release.name}
                  </span>
                  <StateBadge state={dynamicState as any} />
                  {/* Release Readiness Badge: only show if state is 'next' or 'pending' */}
                  {['next', 'pending'].includes(dynamicState) && (() => {
                    // Always use the database state for the badge
                    const isReleaseReady = getCurrentReleaseReadyState();
                    const notReadyClass = days < 3
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200';
                    return (
                      <Badge
                        variant={isReleaseReady ? "default" : "secondary"}
                        className={`text-xs ${isReleaseReady ? 'bg-green-100 text-green-800 border-green-200' : notReadyClass}`}
                      >
                        {isReleaseReady ? "Ready" : "Not Ready"}
                      </Badge>
                    );
                  })()}
                  
                </div>
              </div>
              <div className="flex-1 flex justify-center items-center space-x-4">
                <CardDescription className="m-0">
                  {(() => {
                    const label = isPast ? "Release Date" : "Target Date";
                    const [year, month, day] = release.target_date.split('-');
                    const dateStr = `${Number(month)}/${Number(day)}/${year}`;
                    return isPast
                      ? `${label}: ${dateStr}`
                      : `${label}: ${dateStr} (${days} days)`;
                  })()}
                </CardDescription>
                
                {/* Archive checkbox for release managers - only show when release is past due or cancelled */}
                {is_release_manager && (dynamicState === 'past_due' || dynamicState === 'cancelled') && (
                  <div className="flex items-center space-x-2 bg-white p-2 rounded hover:bg-gray-100 transition-colors shadow-sm ml-4">
                    <label 
                      htmlFor={`archive-${release.id}`} 
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                    >
                      Archive
                    </label>
                    <Checkbox
                      checked={isArchived}
                      onCheckedChange={handleArchiveChange}
                      disabled={archiving}
                      id={`archive-${release.id}`}
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Move link and release notes buttons to the right side */}
            <div className="flex items-center space-x-2 ml-4">
              {collapsible && (
                <button
                  type="button"
                  aria-label="View Release Detail"
                  title="View release detail page"
                  className="bg-white p-2 rounded hover:bg-gray-100 transition-colors shadow-sm"
                  onClick={e => {
                    e.stopPropagation();
                    router.push(`/releases/${encodeURIComponent(release.name)}`);
                  }}
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              )}
              <button
                type="button"
                aria-label="View Release Notes"
                title="View release notes"
                className="bg-white p-2 rounded hover:bg-gray-100 transition-colors shadow-sm"
                onClick={e => {
                  e.stopPropagation();
                  router.push(`/releases/${encodeURIComponent(release.name)}/releasenotes`);
                }}
              >
                <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>

              {/* Deploy button for release managers - always show but disable based on state */}
              {is_release_manager && (
                <button
                  type="button"
                  aria-label="Mark as Deployed"
                  title={(() => {
                    const isReleaseReady = getCurrentReleaseReadyState();
                    const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                    if (isDeployed) return "Already deployed";
                    if (!isReleaseReady) return "Release not ready for deployment";
                    return "Mark as deployed";
                  })()}
                  className={`p-2 rounded shadow-sm transition-colors ${
                    (() => {
                      const isReleaseReady = getCurrentReleaseReadyState();
                      const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                      return isReleaseReady && !isDeployed && ['pending', 'next'].includes(dynamicState)
                        ? 'bg-white hover:bg-green-100 hover:border-green-200'
                        : 'bg-gray-50 opacity-50 cursor-not-allowed';
                    })()
                  }`}
                  onClick={e => {
                    e.stopPropagation();
                    const isReleaseReady = getCurrentReleaseReadyState();
                    const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                    if (isReleaseReady && !isDeployed && ['pending', 'next'].includes(dynamicState)) {
                      handleDeployToggle();
                    }
                  }}
                  disabled={(() => {
                    const isReleaseReady = getCurrentReleaseReadyState();
                    const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                    return !(isReleaseReady && !isDeployed && ['pending', 'next'].includes(dynamicState));
                  })()}
                >
                  <CheckSquare className={`h-4 w-4 transition-colors ${
                    (() => {
                      const isReleaseReady = getCurrentReleaseReadyState();
                      const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                      return isReleaseReady && !isDeployed && ['pending', 'next'].includes(dynamicState)
                        ? 'text-green-500 hover:text-green-600'
                        : 'text-gray-400';
                    })()
                  }`} />
                </button>
              )}

              {/* Cancel button for release managers - always show but disable based on state */}
              {is_release_manager && (
                <button
                  type="button"
                  aria-label="Cancel Release"
                  title={(() => {
                    const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                    if (isDeployed) return "Cannot cancel deployed release";
                    return "Cancel this release";
                  })()}
                  className={`p-2 rounded shadow-sm transition-colors ${
                    (() => {
                      const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                      return !isDeployed && ['pending', 'next'].includes(dynamicState)
                        ? 'bg-white hover:bg-red-100 hover:border-red-200'
                        : 'bg-gray-50 opacity-50 cursor-not-allowed';
                    })()
                  }`}
                  onClick={e => {
                    e.stopPropagation();
                    const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                    if (!isDeployed && ['pending', 'next'].includes(dynamicState)) {
                      handleCancelRelease();
                    }
                  }}
                  disabled={(() => {
                    const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                    return !(!isDeployed && ['pending', 'next'].includes(dynamicState));
                  })()}
                >
                  <X className={`h-4 w-4 transition-colors ${
                    (() => {
                      const isDeployed = expandedReleaseDetail?.is_deployed || release.is_deployed;
                      return !isDeployed && ['pending', 'next'].includes(dynamicState)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-400';
                    })()
                  }`} />
                </button>
              )}

              {/* Edit button for release managers - always show but disable based on state */}
              {is_release_manager && (
                <button
                  type="button"
                  aria-label="Edit Release"
                  title={(() => {
                    if (!['pending', 'next'].includes(dynamicState)) {
                      return "Cannot edit release in current state";
                    }
                    return "Edit release";
                  })()}
                  className={`p-2 rounded shadow-sm transition-colors ${
                    ['pending', 'next'].includes(dynamicState)
                      ? 'bg-white hover:bg-gray-100'
                      : 'bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={e => {
                    e.stopPropagation();
                    if (['pending', 'next'].includes(dynamicState)) {
                      setEditOpen(true);
                    }
                  }}
                  disabled={!['pending', 'next'].includes(dynamicState)}
                >
                  <Pencil className={`h-4 w-4 transition-colors ${
                    ['pending', 'next'].includes(dynamicState)
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-gray-400'
                  }`} />
                </button>
              )}

              {/* Delete button for release managers - always show */}
              {is_release_manager && (
                <button
                  type="button"
                  aria-label="Delete Release"
                  title="Delete release"
                  className="bg-white p-2 rounded hover:bg-red-100 transition-colors shadow-sm hover:border-red-200"
                  onClick={e => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600 transition-colors" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pb-2">
            {/* Platform/Config mini-card on the left with 'Release' header */}
            <MiniCard title="Release">
              <div className="flex flex-row w-full gap-2">
                <div className="flex flex-col justify-between flex-1">
                  <span className="text-xs font-medium text-muted-foreground pb-6">Platform</span>
                  <span className="text-xs font-medium text-muted-foreground">Config</span>
                </div>
                <div className="flex flex-col justify-between flex-1 items-end">
                  <Badge className={release.platform_update ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'} variant="outline">
                    {release.platform_update ? 'Yes' : 'No'}
                  </Badge>
                  <Badge className={release.config_update ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'} variant="outline">
                    {release.config_update ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </MiniCard>
            {/* Targets mini-card */}
            <MiniCard title="Targets">
              <div className="flex flex-wrap gap-1 mt-1 justify-center w-full">
                {release.targets && release.targets.length > 0 ? (
                  release.targets.map((target: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {target}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm"></span>
                )}
              </div>
            </MiniCard>
           
            {/** Key Feature Readiness Donut Chart as a mini-card */}
            {selectedProject?.is_manage_features && (() => {
              // Calculate internal is_ready state for features
              const isFeaturesReady = summaryFeatureCount > 0 && summaryReadyFeatures === summaryFeatureCount;
              
              // Calculate days until release
              const daysUntilRelease = getDaysUntil(release.target_date);
              
              // Determine if user has unready features (is DRI of any feature that's not ready)
              const userHasUnreadyFeatures = memberId && features.some(feature => 
                feature.dri_member_id === memberId && !feature.is_ready
              );
              
              // Determine donut color based on new logic
              let donutColor = "#22c55e"; // Default green
              if (isFeaturesReady) {
                donutColor = "#22c55e"; // Green when all features ready
              } else if (daysUntilRelease < 3 && userHasUnreadyFeatures) {
                donutColor = "#ef4444"; // Red when < 3 days and user has unready features
              } else if (isUserDRI()) {
                donutColor = "#3b82f6"; // Blue when user is DRI and features not ready
              }
              
              return (
                <MiniCard title="Features Ready" wide>
                  <div className="flex items-center justify-center w-16 h-16">
                    {summaryFeatureCount > 0 ? (
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="#e5e7eb" // Tailwind gray-200
                          strokeWidth="8"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke={donutColor}
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - summaryReadyFeatures / summaryFeatureCount)}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.5s' }}
                        />
                        {summaryReadyFeatures === summaryFeatureCount ? (
                          <g>
                            <circle cx="32" cy="32" r="18" fill={donutColor} opacity="0.15" />
                            <Check x={20} y={20} width={24} height={24} color={donutColor} strokeWidth={3} />
                          </g>
                        ) : (
                          <text
                            x="32"
                            y="38"
                            textAnchor="middle"
                            fontSize="18"
                            fill="#374151" // Tailwind gray-700
                            fontWeight="bold"
                          >
                            {`${summaryReadyFeatures}/${summaryFeatureCount}`}
                          </text>
                        )}
                      </svg>
                    ) : (
                      <span className="text-xs text-muted-foreground">No features</span>
                    )}
                  </div>
                </MiniCard>                );
            })()}

            {/* Teams mini-card */}
            {selectedProject?.is_manage_members && (
              <MiniCard title="Teams">
                <div className="flex flex-wrap gap-1 mt-1 justify-center w-full">
                  {teamNames.length > 0 ? (
                    teamNames.map((team) => (
                      <Badge key={team} variant="secondary" className="text-xs">
                        {team}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm"></span>
                  )}
                </div>
              </MiniCard>
            )}
 
            {/** Team Readiness coloring logic */}
            {selectedProject?.is_manage_members && (() => {
              // Calculate internal is_ready state for teams
              const isTeamsReady = summaryTotalMembers > 0 && summaryReadyMembers === summaryTotalMembers;
              
              // Calculate days until release
              const daysUntilRelease = getDaysUntil(release.target_date);
              
              // Determine if user has unready items (is a member but not ready)
              const userHasUnreadyItems = memberId && uniqueMembers.some(member => 
                member.id === memberId && !member.is_ready
              );
              
              // Determine donut color based on new logic
              let donutColor = "#22c55e"; // Default green
              if (isTeamsReady) {
                donutColor = "#22c55e"; // Green when all teams ready
              } else if (daysUntilRelease < 3 && userHasUnreadyItems) {
                donutColor = "#ef4444"; // Red when < 3 days and user has unready items
              } else if (isUserMember()) {
                donutColor = "#3b82f6"; // Blue when user is member and teams not ready
              }
              
              return (
                <MiniCard title="Team Ready" wide>
                  <div className="flex items-center justify-center w-16 h-16">
                    {summaryTotalMembers > 0 ? (
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="#e5e7eb" // Tailwind gray-200
                          strokeWidth="8"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke={donutColor}
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - summaryReadyMembers / summaryTotalMembers)}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.5s' }}
                        />
                        {isTeamsReady ? (
                          <g>
                            <circle cx="32" cy="32" r="18" fill={donutColor} opacity="0.15" />
                            <Check x={20} y={20} width={24} height={24} color={donutColor} strokeWidth={3} />
                          </g>
                        ) : (
                          <text
                            x="32"
                            y="38"
                            textAnchor="middle"
                            fontSize="18"
                            fill="#374151" // Tailwind gray-700
                            fontWeight="bold"
                          >
                            {`${summaryReadyMembers}/${summaryTotalMembers}`}
                          </text>
                        )}
                      </svg>
                    ) : (
                      <span className="text-xs text-muted-foreground">No members</span>
                    )}
                  </div>
                </MiniCard>
              );
            })()}

            {/* Deployment mini-card */}
            <MiniCard title="Deployed" wide>
              <div className="flex items-center justify-center w-16 h-16">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#e5e7eb" // Tailwind gray-200
                    strokeWidth="8"
                  />
                  {(expandedReleaseDetail?.is_deployed || release.is_deployed) ? (
                    <>
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="#22c55e" // Tailwind green-500
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                      <g>
                        <circle cx="32" cy="32" r="18" fill="#22c55e" opacity="0.15" />
                        <Check x={20} y={20} width={24} height={24} color="#22c55e" strokeWidth={3} />
                      </g>
                    </>
                  ) : null}
                </svg>
              </div>
            </MiniCard>


          </div>
        </CardContent>
      </Card>
      {expanded && (
        <>
          {detailLoading ? (
            <Card className="rounded-none rounded-b-lg border-t-0 shadow-none">
              <CardContent className="py-0 px-0">
                <Skeleton height={180} />
              </CardContent>
            </Card>
          ) : detailError ? (
            <Card className="rounded-none rounded-b-lg border-t-0 shadow-none">
              <CardContent className="flex items-center justify-center py-8 text-red-600">
                <span>{detailError}</span>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-none rounded-b-lg border-t-0 shadow-none">
              <CardContent className="pt-6">
                <ReleaseDetailBottomContent
                  release={expandedReleaseDetail || release}
                  user={user}
                  memberId={memberId ?? ""}
                  features={features}
                  uniqueMembers={uniqueMembers}
                  updatingFeature={updatingFeature}
                  handleFeatureReadyChange={handleFeatureReadyChange}
                  updateMemberReady={updateMemberReady}
                  onFeatureUpdated={() => {
                    // Reset the expanded release detail to force a refresh
                    setExpandedReleaseDetail(null);
                    onReleaseUpdated?.();
                  }}
                  onTeamsChanged={handleTeamsChanged}
                  onFeatureChanged={handleFeatureChanged}
                  onFeatureEdited={handleFeatureEdited}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
      <CreateReleaseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialRelease={release}
        onReleaseSaved={() => onReleaseUpdated?.()}
        isEdit={true}
      />
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Release</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the release &quot;{release.name}&quot;?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. All release data, features, and team assignments will be permanently deleted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 