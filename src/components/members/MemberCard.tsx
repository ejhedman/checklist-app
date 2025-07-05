import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Edit, Trash2 } from "lucide-react";
import { EditMemberDialog } from "./EditMemberDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface Member {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  created_at: string;
  teams: string[];
  active_releases: number;
}

export function MemberCard({ member, onMemberUpdated }: { member: Member; onMemberUpdated: () => void }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  
  // Check if this member card represents the logged-in user
  const isCurrentUser = user?.email === member.email;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("users").delete().eq("id", member.id);
      if (error) {
        alert("Failed to delete member: " + error.message);
        return;
      }
      setDeleteDialogOpen(false);
      onMemberUpdated();
    } catch (error) {
      alert("An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className={isCurrentUser ? "bg-blue-50 border-blue-200" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            {member.full_name}
            {member.nickname && member.nickname !== member.full_name && (
              <span className="ml-2 text-muted-foreground text-base font-normal">(aka: {member.nickname})</span>
            )}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <EditMemberDialog member={member} onMemberUpdated={onMemberUpdated} />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Member</DialogTitle>
                </DialogHeader>
                <div>Are you sure?</div>
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
        </div>
        <CardDescription className="flex items-center">
          <Mail className="h-3 w-3 mr-1" />
          {member.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-1">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Teams</p>
              <p className="text-sm text-muted-foreground">Active Releases</p>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-wrap gap-1">
                {member.teams.length > 0 ? (
                  member.teams.map((team) => (
                    <Badge key={team} variant="secondary" className="text-xs">
                      {team}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No teams assigned</p>
                )}
              </div>
              <p className="text-lg font-semibold">{member.active_releases}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 