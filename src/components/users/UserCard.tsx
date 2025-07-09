import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Edit, Trash2, Clock, Shield } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";
import { UpdatePasswordDialog } from "./UpdatePasswordDialog";
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
import { useToast } from "@/components/ui/toast";

export interface User {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  role: 'user' | 'release_manager' | 'admin' | 'superuser';
  created_at: string;
  last_sign_in_at?: string;
  app_role?: 'admin' | 'user';
  project_count?: number;
}

export function UserCard({ user, onUserUpdated }: { user: User; onUserUpdated: () => void }) {
  const { addToast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user: currentUser, userRole, loading } = useAuth();
  
  // Check if this user card represents the logged-in user
  const isCurrentUser = currentUser?.email === user.email;
  
  // Check if current user has admin role (only when not loading)
  const isAdmin = !loading && userRole === 'admin';
  
  // Debug logging
  // console.log('UserCard - loading:', loading);
  // console.log('UserCard - userRole:', userRole);
  // console.log('UserCard - isAdmin:', isAdmin);
  // console.log('UserCard - currentUser email:', currentUser?.email);
  // console.log('UserCard - user email:', user.email);

  const formatLastLogin = (lastSignInAt?: string) => {
    if (!lastSignInAt) {
      return "Never";
    }
    const date = new Date(lastSignInAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'user':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        addToast("Failed to delete user: " + data.error, "error");
        return;
      }

      setDeleteDialogOpen(false);
      addToast("User deleted successfully!", "success");
      onUserUpdated();
    } catch (error) {
      addToast("An unexpected error occurred", "error");
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
            {user.full_name}
          </CardTitle>
          {isAdmin && (
            <div className="flex items-center space-x-1">
              <EditUserDialog user={user} onUserUpdated={onUserUpdated} />
              <UpdatePasswordDialog user={user} onPasswordUpdated={onUserUpdated} />
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                  </DialogHeader>
                  <div>Are you sure you want to delete this user? This action cannot be undone.</div>
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
          )}
        </div>
        <CardDescription className="flex items-center">
          <Mail className="h-3 w-3 mr-1" />
          {user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-1">
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
            <div className="flex items-center justify-between mt-1">
              <Badge variant={getRoleColor(user.app_role || 'user') as any} className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {getRoleLabel(user.app_role || 'user')}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {user.project_count || 0}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm text-muted-foreground">Last Login</p>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="text-sm">{formatLastLogin(user.last_sign_in_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 