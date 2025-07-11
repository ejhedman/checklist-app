import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EditFeatureDialog } from "./EditFeatureDialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FeatureCardProps {
  feature: any;
  user: any;
  memberId: string | null;
  updatingFeature: boolean;
  handleFeatureReadyChange: (feature: any, isReady: boolean) => void;
  onFeatureUpdated?: () => void;
  releaseName?: string;
  daysUntilRelease?: number;
  onFeatureEdited?: (updatedFeature: any) => void;
}

export default function FeatureCard({ feature, user, memberId, updatingFeature, handleFeatureReadyChange, onFeatureUpdated, releaseName, daysUntilRelease, onFeatureEdited }: FeatureCardProps) {
  const { is_release_manager } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isDri = memberId && feature.dri_member && memberId === feature.dri_member.id;
  // Only the logged-in user who is the DRI OR a release manager can check the box
  const canMarkReady = (memberId && feature.dri_member && memberId === feature.dri_member.id) || is_release_manager;
  // Determine badge color for not ready
  const notReadyClass = daysUntilRelease !== undefined && daysUntilRelease < 3
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-amber-100 text-amber-800 border-amber-200';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("features")
        .delete()
        .eq("id", feature.id);

      if (error) {
        console.error('Failed to delete feature:', error);
        return;
      }

      setDeleteDialogOpen(false);
      // Call the callback to refresh the parent component
      onFeatureUpdated?.();
    } catch (error) {
      console.error('Error deleting feature:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`p-3 border rounded-lg relative ${isDri ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
      {/* Edit and Delete buttons in top right corner */}
      <div className="absolute top-2 right-2 flex items-center space-x-1">
        <EditFeatureDialog 
          feature={feature} 
          releaseName={releaseName || "this release"} 
          onFeatureUpdated={onFeatureUpdated || (() => {})} 
          onFeatureChanged={onFeatureEdited}
        />
        {is_release_manager && (
          <button
            type="button"
            aria-label="Delete Feature"
            title="Delete feature"
            className="p-1 rounded hover:bg-red-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700 transition-colors" />
          </button>
        )}
      </div>
      
      {/* Top row: Platform/Config badges (left), Feature name: description (right) */}
      <div className="flex flex-row items-center w-full gap-2 pr-8">
        <div className="flex flex-row items-center space-x-2 min-w-[80px]">
          {feature.is_platform && (
            <Badge variant="outline" className="text-xs">Platform</Badge>
          )}
          {feature.is_config && (
            <Badge variant="outline" className="text-xs">Config</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground flex-1 min-w-0 truncate pr-6">
          {feature.name}{feature.description ? `: ${feature.description}` : ''}
        </p>
      </div>
      {/* Bottom row: DRI info (left), JIRA and comments (center), Ready checkbox/state (right) */}
      <div className="mt-2 flex flex-row items-center w-full gap-2">
        {/* DRI info (left) */}
        <div className="min-w-[120px] md:w-1/4 flex flex-col items-start">
          {feature.dri_member ? (
            <span className="text-sm font-medium truncate flex items-center gap-1">
              <span className="text-xs font-semibold text-muted-foreground">DRI:</span>
              {feature.dri_member.nickname || feature.dri_member.full_name}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No DRI assigned</span>
          )}
        </div>
        {/* JIRA and comments (center) */}
        <div className="flex-1 min-w-0 flex flex-col items-center">
          {feature.jira_ticket && (
            <p className="text-xs text-muted-foreground truncate">JIRA: {feature.jira_ticket}</p>
          )}
          {feature.comments && (
            <p className="text-xs text-muted-foreground italic truncate">Comments: {feature.comments}</p>
          )}
        </div>
        {/* Ready checkbox/state (right) */}
        <div className="flex items-center min-w-[110px] md:w-1/4 justify-end">
          {canMarkReady && (
            <>
              <label htmlFor={`feature-ready-${feature.id}`} className="text-xs text-muted-foreground cursor-pointer select-none mr-2">Ready</label>
              <Checkbox
                checked={feature.is_ready}
                onCheckedChange={(checked) => {
                  handleFeatureReadyChange(feature, checked === true);
                }}
                disabled={updatingFeature}
                id={`feature-ready-${feature.id}`}
              />
            </>
          )}
          <Badge
            className={`text-xs ml-2 ${feature.is_ready ? 'bg-green-100 text-green-800 border-green-200' : notReadyClass}`}
          >
            {feature.is_ready ? "Ready" : "Not Ready"}
          </Badge>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feature</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the feature &quot;{feature.name}&quot;?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. All feature data, comments, and readiness status will be permanently deleted.
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
    </div>
  );
} 