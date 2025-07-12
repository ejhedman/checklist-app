import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Trash2 } from "lucide-react";
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
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      alert("An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className={isCurrentUser ? "bg-blue-50 border-blue-200" : ""}>
      <CardHeader className="relative">
        {/* Name and nickname at the top of the header */}
        <div className="flex flex-col min-w-0 pr-12">
          <div className="flex items-center gap-2 min-w-0">
            <User className="h-5 w-5" />
            <span className="font-semibold text-lg truncate min-w-0">{member.full_name}</span>
          </div>
          {member.nickname && member.nickname !== member.full_name && (
            <span className="text-xs text-muted-foreground ml-7">(aka: {member.nickname})</span>
          )}
        </div>
        {/* Edit and Delete buttons in top right corner */}
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <EditMemberDialog member={member} onMemberUpdated={onMemberUpdated} />
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="border border-gray-300 rounded-md p-1 hover:bg-red-100 hover:text-red-600">
                <Trash2 className="h-4 w-4 text-red-500" />
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
      </CardHeader>
      {/* Email row below name */}
      <div className="px-6 pt-0 pb-2 min-w-0 w-full">
        <div className="flex items-center gap-2 min-w-0 w-full">
          <Mail className="h-3 w-3" />
          <span className="text-sm text-muted-foreground break-all min-w-0 w-full">
            {member.email}
          </span>
        </div>
      </div>
      <CardContent className="pb-1">
        <div className="space-y-3">
          <div>
            <div className="flex flex-col md:flex-row justify-between gap-4 w-full mt-2">
              {/* Teams group on the left */}
              <div className="flex flex-col items-start flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Teams</p>
                <div className="flex flex-wrap gap-1 justify-start w-full">
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
              {/* Role group on the right */}
              <div className="flex flex-col items-start flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge 
                  variant="outline" 
                  className={`text-xs w-fit max-w-full truncate ${getRoleBadgeStyle(member.member_role)}`}
                  style={{maxWidth: '140px'}}
                >
                  {member.member_role.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 