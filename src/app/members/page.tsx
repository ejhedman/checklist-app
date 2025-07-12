"use client";

import { AddMemberDialog } from "@/components/members/AddMemberDialog";
import { MemberCard } from "@/components/members/MemberCard";
import { useMembers } from "@/hooks/useMembers";
import { LoadingSpinner } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";

export default function MembersPage() {
  const { members, loading, refetch } = useMembers();

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
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight truncate">Members</h1>
          <p className="text-muted-foreground truncate">
            Manage team members and their roles
          </p>
        </div>
        <div className="w-full md:w-auto flex-shrink-0">
          <AddMemberDialog onMemberAdded={handleMemberAdded} />
        </div>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No members found. Add your first member to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} onMemberUpdated={handleMemberAdded} />
          ))}
        </div>
      )}
    </div>
  );
} 