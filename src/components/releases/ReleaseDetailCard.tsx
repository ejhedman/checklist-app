"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FeatureReadyDialog } from "@/components/releases/FeatureReadyDialog";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import FeatureCard from "./FeatureCard";

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

export default function ReleaseDetailCard({ release, onMemberReadyChange } : {
  release: any,
  onMemberReadyChange?: (releaseId: string, userId: string, isReady: boolean) => void,
}) {
  const { user } = useAuth();
  const [readyDialogOpen, setReadyDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [updatingFeature, setUpdatingFeature] = useState(false);
  const [isArchived, setIsArchived] = useState(release.is_archived);
  const [archiving, setArchiving] = useState(false);

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
      console.log('is_archived updated successfully');
    }
    setArchiving(false);
    // Optionally, handle error or refresh data
  };

  const handleFeatureReadyChange = async (feature: any, isReady: boolean) => {
    // Check if current user is the DRI for this feature
    if (!user || !feature.dri_user || user.id !== feature.dri_user.id) {
      console.log("User is not the DRI for this feature");
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
      setReadyDialogOpen(false);
      setSelectedFeature(null);
    }
  };

  const handleReadyDialogCancel = () => {
    setReadyDialogOpen(false);
    setSelectedFeature(null);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${getStateColor(release.state)}`} />
            <CardTitle className="flex items-center">
              {getStateIcon(release.state)}
              <span className="ml-2">{release.name}</span>
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{release.state.replace('_', ' ')}</Badge>
            <a
              href={`/releases/${encodeURIComponent(release.name)}/releasenotes`}
              className="ml-4 text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Release Notes
            </a>
          </div>
        </div>
        <CardDescription>
          {(() => {
            const days = getDaysUntil(release.target_date);
            const isPast = days < 0;
            const [year, month, day] = release.target_date.split('-');
            const dateStr = `${Number(month)}/${Number(day)}/${year}`;
            return (
              <span className="flex items-center gap-2">
                Target Date: {dateStr} ({days} days)
                {isPast && (
                  <span className="flex items-center ml-4">
                    <Checkbox
                      checked={!!isArchived}
                      onCheckedChange={checked => handleArchiveChange(!!checked)}
                      disabled={archiving}
                      id="archive-checkbox"
                    />
                    <label htmlFor="archive-checkbox" className="ml-2 text-sm select-none cursor-pointer">Archive</label>
                  </span>
                )}
              </span>
            );
          })()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Teams</p>
            <p className="text-lg font-semibold">{release.team_count}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Features</p>
            <p className="text-lg font-semibold">
              {release.ready_features}/{release.feature_count}
            </p>
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

        {/* Features Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Features</h4>
          </div>
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
        </div>

        {/* Team Members Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </h4>
          </div>

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
                        <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            {onMemberReadyChange && (
                              <Checkbox
                                checked={member.is_ready}
                                onCheckedChange={(checked) => 
                                  onMemberReadyChange(release.id, member.id, checked as boolean)
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
        </div>
      </CardContent>
      
      <FeatureReadyDialog
        open={readyDialogOpen}
        onOpenChange={handleReadyDialogCancel}
        featureName={selectedFeature?.name || ""}
        onConfirm={handleReadyDialogConfirm}
        loading={updatingFeature}
      />
    </Card>
  );
} 