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
  member_role: 'member' | 'release_manager' | 'admin';
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

  // Function to get badge styling based on role
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
      case 'release_manager':
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("members").delete().eq("id", member.id);
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
      <CardHeader className="relative">
        {/* Edit and Delete buttons in top right corner */}
        <div className="absolute top-2 right-2 flex items-center space-x-1">
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
        {/* Email row styled exactly like feature name row */}
        <div className="flex flex-row items-center w-full gap-2 pr-8">
          <Mail className="h-3 w-3 mr-1 shrink-0" />
          <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate pr-6">
            {member.email}
          </span>
        </div>
        {/* Name/nickname and role badge row (centered in columns) */}
        <div className="flex flex-col md:flex-row gap-2 mt-1 mb-2">
          {/* Name/nickname column */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-0">
            <span className="font-semibold text-lg flex items-center justify-center">
              <User className="h-5 w-5 mr-2" />
              {member.full_name}
            </span>
            {member.nickname && member.nickname !== member.full_name && (
              <span className="text-muted-foreground text-base font-normal">(aka: {member.nickname})</span>
            )}
          </div>
          {/* Role badge column */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <Badge 
              variant="outline" 
              className={`text-xs w-fit max-w-full truncate ${getRoleBadgeStyle(member.member_role)}`}
              style={{maxWidth: '140px'}}
            >
              {member.member_role.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-1">
        <div className="space-y-3">
          <div>
            <div className="flex flex-col md:flex-row justify-between gap-4 w-full mt-2">
              {/* Teams group */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Teams</p>
                <div className="flex flex-wrap gap-1 justify-center w-full">
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
              </div>
              {/* Active Releases group */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Active Releases</p>
                <p className="text-lg font-semibold">{member.active_releases}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 