"use client";

import { AddMemberDialog } from "@/components/members/AddMemberDialog";
import { MemberCard, Member } from "@/components/members/MemberCard";
import { useAuth } from "@/contexts/AuthContext";
import { useMembers } from "@/hooks/useMembers";
import { LoadingSpinner } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";

export default function MembersPage() {
  const { selectedProject } = useAuth();
  const { members, loading, error, refetch } = useMembers();

  const handleMemberAdded = () => {
    refetch(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage team members and their roles
          </p>
        </div>
        <AddMemberDialog onMemberAdded={handleMemberAdded} />
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No members found. Add your first member to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} onMemberUpdated={handleMemberAdded} />
          ))}
        </div>
      )}
    </div>
  );
} 