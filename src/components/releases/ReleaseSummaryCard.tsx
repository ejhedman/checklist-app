import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, FileText, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import Link from "next/link";
import React from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { StateBadge, getStateBackgroundColor } from "@/components/ui/state-icons";
import { useRouter } from "next/navigation";
import { ReleaseDetailBottomContent } from "./ReleaseDetailBottomContent";
import ReleaseDetailCard from "./ReleaseDetailCard";
import { LoadingSpinner } from "@/components/ui/loading";
import { CreateReleaseDialog } from "./CreateReleaseDialog";
import { Skeleton } from "@/components/ui/Skeleton";

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
    targets?: string[];
    tenant?: {
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
  getStateIcon: (state: string) => React.ReactNode;
  onReleaseUpdated?: () => void;
  initialExpanded?: boolean;
  collapsible?: boolean;
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

export const ReleaseSummaryCard: React.FC<ReleaseSummaryCardProps> = ({
  release,
  getStateIcon,
  onReleaseUpdated,
  initialExpanded = false,
  collapsible = false,
}) => {
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [isArchived, setIsArchived] = useState(release.is_archived);
  const [archiving, setArchiving] = useState(false);
  const { user, memberId, selectedTenant, is_release_manager } = useAuth();
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
  const [summaryState, setSummaryState] = useState(release.state);

  // Debug: Log features and user
  // console.log('ReleaseSummaryCard:', {
  //   releaseName: release.name,
  //   features: release.features,
  //   userId: user?.id,
  //   memberId,
  //   driIds: release.features?.map(f => f.dri_member_id)
  // });

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
    if (expanded && !expandedReleaseDetail && selectedTenant && user) {
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
            state,
            platform_update,
            config_update,
            is_archived,
            targets,
            created_at,
            tenant_id,
            tenants (
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
                    tenant_id
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
          .eq("tenant_id", selectedTenant.id)
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
                tenant_id: tm.member.tenant_id,
                is_ready: memberReadyState?.is_ready || false,
              };
            }) || [],
          })) || [],
          total_members,
          ready_members,
          tenant: data.tenants,
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
  }, [expanded, selectedTenant, user, release.id, expandedReleaseDetail]);

  // Keep summary counts in sync with expandedReleaseDetail
  useEffect(() => {
    if (expandedReleaseDetail) {
      setSummaryReadyMembers(expandedReleaseDetail.ready_members);
      setSummaryTotalMembers(expandedReleaseDetail.total_members);
      setSummaryReadyFeatures(expandedReleaseDetail.ready_features);
      setSummaryFeatureCount(expandedReleaseDetail.feature_count);
      setSummaryState(expandedReleaseDetail.state);
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
    if (!user || !feature.dri_member || memberId !== feature.dri_member.id) {
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
      setFeatures((prev: any[]) =>
        prev.map((f: any) =>
          f.id === featureId ? { ...f, is_ready: isReady, comments } : f
        )
      );
      
      // Update the release summary counts
      if (expandedReleaseDetail) {
        const oldFeature = features.find((f: any) => f.id === featureId);
        const readyFeaturesChange = oldFeature && oldFeature.is_ready !== isReady ? (isReady ? 1 : -1) : 0;
        
        const updatedDetail = {
          ...expandedReleaseDetail,
          ready_features: expandedReleaseDetail.ready_features + readyFeaturesChange
        };
        setExpandedReleaseDetail(updatedDetail);
        
        // Check if release state should automatically change
        await checkAndUpdateReleaseState(updatedDetail, uniqueMembers);
      }
    }
    setUpdatingFeature(false);
  };

  const updateMemberReady = async (releaseId: string, memberId: string, isReady: boolean) => {
    const supabase = createClient();
    let memberTenantId = null;
    if (expandedReleaseDetail && expandedReleaseDetail.teams) {
      for (const team of expandedReleaseDetail.teams) {
        const member = team.members?.find((m: any) => m.id === memberId);
        if (member) {
          memberTenantId = member.tenant_id;
          break;
        }
      }
    }
    if (!memberTenantId && expandedReleaseDetail?.tenant?.id) {
      memberTenantId = expandedReleaseDetail.tenant.id;
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
      // Update the uniqueMembers state
      const updatedUniqueMembers = uniqueMembers.map((m: any) =>
        m.id === memberId ? { ...m, is_ready: isReady } : m
      );
      setUniqueMembers(updatedUniqueMembers);
      
      // Update the release summary counts
      if (expandedReleaseDetail) {
        const updatedReadyMembers = updatedUniqueMembers.filter((m: any) => m.is_ready).length;
        const updatedDetail = {
          ...expandedReleaseDetail,
          ready_members: updatedReadyMembers
        };
        setExpandedReleaseDetail(updatedDetail);
        
        // Check if release state should automatically change using the updated members array
        await checkAndUpdateReleaseState(updatedDetail, updatedUniqueMembers);
      }
    }
  };

  // Function to check and automatically update release state based on ready status
  const checkAndUpdateReleaseState = async (releaseDetail: any, members: any[]) => {
    const totalFeatures = releaseDetail.feature_count;
    const readyFeatures = releaseDetail.ready_features;
    const totalMembers = members.length;
    const readyMembers = members.filter((m: any) => m.is_ready).length;
    
    // Determine if all features and members are ready
    const allFeaturesReady = totalFeatures > 0 && readyFeatures === totalFeatures;
    const allMembersReady = totalMembers > 0 && readyMembers === totalMembers;
    const hasNotReadyItems = readyFeatures < totalFeatures || readyMembers < totalMembers;
    
    let newState = releaseDetail.state;
    
    // If all features and members are ready, set state to "ready"
    if (allFeaturesReady && allMembersReady) {
      newState = "ready";
    }
    // If there are any not-ready items, set state to "pending"
    else if (hasNotReadyItems) {
      newState = "pending";
    }
    
    // Only update if the state actually changed
    if (newState !== releaseDetail.state) {
      const supabase = createClient();
      const { error } = await supabase
        .from("releases")
        .update({ state: newState })
        .eq("id", release.id);
      
      if (error) {
        console.error('Error updating release state:', error);
      } else {
        // Update the local state
        setExpandedReleaseDetail((prev: any) => prev ? { ...prev, state: newState } : null);
        
        // Log activity for state change
        if (user?.id) {
          const { error: activityError } = await supabase.from("activity_log").insert({
            release_id: release.id,
            member_id: memberId,
            tenant_id: releaseDetail.tenant?.id || "",
            activity_type: "release_state_change",
            activity_details: { 
              oldState: releaseDetail.state, 
              newState,
              reason: "automatic_state_change",
              readyFeatures,
              totalFeatures,
              readyMembers,
              totalMembers,
              releaseName: releaseDetail.name
            },
          });
          if (activityError) {
            console.error("Failed to log release state change activity:", activityError);
          }
        }
      }
    }
  };

  // Handle team changes locally without triggering full refresh
  const handleTeamsChanged = async (addedTeams: string[], removedTeams: string[]) => {
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
      
              // Check if release state should automatically change
        checkAndUpdateReleaseState(updatedDetail, uniqueMembers);
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
        
        // Check if release state should automatically change
        checkAndUpdateReleaseState(updatedDetail, uniqueMembers);
      }
    }
  };

  // Helper to calculate days until target date
  const days = getDaysUntil(release.target_date);
  const isPast = days < 0;

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
        <CardHeader className={`flex flex-row items-center justify-between px-4 py-3 rounded-t-lg ${collapsible && expanded ? '' : collapsible ? 'border-b border-border' : ''} ${getStateBackgroundColor(summaryState as any, release.is_archived)}`}>
          <div className="flex items-center justify-between w-full">
            <div
              className="flex items-center flex-1 min-w-0 rounded px-1 py-0.5 transition-colors"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {collapsible && (
                  <button
                    type="button"
                    aria-label={expanded ? "Collapse details" : "Expand details"}
                    className="p-2 rounded hover:bg-gray-100 transition-colors"
                    onClick={e => {
                      e.stopPropagation();
                      setExpanded(e => !e);
                    }}
                  >
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                )}
                {getStateIcon(summaryState)}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold truncate">
                    {release.tenant?.name ? `${release.tenant.name}: ` : ''}{release.name}
                  </span>
                  <StateBadge state={summaryState as any} />
                  {collapsible && (
                    <button
                      type="button"
                      aria-label="View Release Detail"
                      className="bg-white p-2 rounded hover:bg-gray-100 transition-colors shadow-sm ml-1"
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
                    className="bg-white p-2 rounded hover:bg-gray-100 transition-colors shadow-sm ml-1"
                    onClick={e => {
                      e.stopPropagation();
                      router.push(`/releases/${encodeURIComponent(release.name)}/releasenotes`);
                    }}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
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
              </div>
            </div>
            <div className="flex items-center space-x-2 justify-end ml-2">
              {!expanded && isPast && (
                <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={!!isArchived}
                    onCheckedChange={checked => handleArchiveChange(!!checked)}
                    disabled={archiving}
                    id={`archive-${release.id}`}
                  />
                  <label htmlFor={`archive-${release.id}`} className="text-sm select-none cursor-pointer">
                    Archive
                  </label>
                </div>
              )}
              {expanded && is_release_manager && (
                <button
                  type="button"
                  aria-label="Edit Release"
                  className="p-2 rounded hover:bg-gray-100 transition-colors"
                  onClick={e => {
                    e.stopPropagation();
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pb-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Platform</p>
              <Badge variant={release.platform_update ? "default" : "secondary"}>
                {release.platform_update ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Specs</p>
              <Badge variant={release.config_update ? "default" : "secondary"}>
                {release.config_update ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Targets</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {release.targets && release.targets.length > 0 ? (
                  release.targets.map((target: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {target}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No targets</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Teams</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {teamNames.length > 0 ? (
                  teamNames.map((team) => (
                    <Badge key={team} variant="secondary" className="text-xs">
                      {team}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No teams</span>
                )}
              </div>
            </div>
            {(!expanded) && (
              <>
                {/** Key Feature Readiness coloring logic */}
                {(() => {
                  const isFeatureComplete = summaryReadyFeatures === summaryFeatureCount && summaryFeatureCount > 0;
                  return (
                    <div className="space-y-1">
                      <p className={`text-sm ${
                        isFeatureComplete
                          ? 'text-green-600 font-bold'
                          : isUserDRI()
                            ? 'text-blue-600 font-bold'
                            : 'text-muted-foreground'
                      }`}>Key Feature Readiness</p>
                      <p className={`text-lg font-semibold ${
                        isFeatureComplete
                          ? 'text-green-600'
                          : isUserDRI()
                            ? 'text-blue-600'
                            : ''
                      }`}>
                        {summaryReadyFeatures}/{summaryFeatureCount}
                      </p>
                    </div>
                  );
                })()}
                {/** Team Readiness coloring logic */}
                {(() => {
                  const isTeamComplete = summaryReadyMembers === summaryTotalMembers && summaryTotalMembers > 0;
                  return (
                    <div className="space-y-1">
                      <p className={`text-sm ${
                        isTeamComplete
                          ? 'text-green-600 font-bold'
                          : isUserMember()
                            ? 'text-blue-600 font-bold'
                            : 'text-muted-foreground'
                      }`}>Team Readiness</p>
                      <p className={`text-lg font-semibold ${
                        isTeamComplete
                          ? 'text-green-600'
                          : isUserMember()
                            ? 'text-blue-600'
                            : ''
                      }`}>
                        {summaryReadyMembers}/{summaryTotalMembers}
                      </p>
                    </div>
                  );
                })()}
              </>
            )}
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
    </>
  );
}; 