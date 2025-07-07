"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { UserCard, User } from "@/components/users/UserCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = userRole === 'admin';

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAdmin, router]);

  const fetchUsers = async () => {
    try {
      // Fetch users from our API endpoint
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        console.error("Error fetching users:", response.statusText);
        return;
      }

      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleUserAdded = () => {
    fetchUsers(); // Refresh the list
  };

  // Show loading while checking auth or redirecting
  if (authLoading || (!isAdmin && !loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if user is not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        {isAdmin && <AddUserDialog onUserAdded={handleUserAdded} />}
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No users found. Add your first user to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} onUserUpdated={handleUserAdded} />
          ))}
        </div>
      )}
    </div>
  );
} 