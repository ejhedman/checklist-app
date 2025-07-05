"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import FeatureCard from "../../components/releases/FeatureCard";

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

export default function ReleaseDetailCard({ release, onMemberReadyChange } : {
  release: any,
  onMemberReadyChange?: (releaseId: string, userId: string, isReady: boolean) => void,
}) {
  const { user } = useAuth();
  const [updatingFeature, setUpdatingFeature] = useState(false);

  const handleFeatureReadyChange = async (feature: any, isReady: boolean) => {
    // Check if current user is the DRI for this feature
    if (!user || !feature.dri_user || user.id !== feature.dri_user.id) {
      console.log("User is not the DRI for this feature");
      return;
    }

    if (isReady) {
      // Open dialog to collect comments
      // setSelectedFeature(feature);
    } else {
      // Directly update to false without comments
      await updateFeatureReady(feature.id, false, "");
    }
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
      console.error("Error updating feature:", error);
    } else {
      // Trigger a page refresh to update the data
      window.location.reload();
    }
    setUpdatingFeature(false);
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
          <Badge
            className={
              release.state === 'ready'
                ? 'bg-green-600 text-white'
                : release.state === 'pending'
                ? 'bg-amber-400 text-black'
                : release.state === 'past_due'
                ? 'bg-red-500 text-white'
                : ''
            }
            variant="outline"
          >
            {release.state.replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription>
          Target Date: {new Date(release.target_date).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Teams</p>
            <p className="text-lg font-semibold">{release.team_count}</p>
          </div>
          <div className="space-y-1">
            <p className="text-lg text-muted-foreground">Features</p>
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
                          <Badge variant={member.is_ready ? "default" : "secondary"} className={member.is_ready ? "text-xs bg-green-600 text-white" : "text-xs bg-amber-400 text-black"}>
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
    </Card>
  );
} 