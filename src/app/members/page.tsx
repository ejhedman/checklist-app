"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Loader2 } from "lucide-react";
import { AddMemberDialog } from "@/components/members/AddMemberDialog";
import { createClient } from "@/lib/supabase";
import { MemberCard, Member } from "@/components/members/MemberCard";

type TeamUser = { teams: { name: string } };
type UserWithTeams = {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  created_at: string;
  team_users?: TeamUser[];
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const supabase = createClient();
      
      // Fetch users with their team memberships
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select(`
          id,
          full_name,
          email,
          nickname,
          created_at,
          team_users (
            teams (
              name
            )
          )
        `)
        .order("full_name");

      if (usersError) {
        console.error("Error fetching users:", usersError);
        return;
      }

      // Transform the data to include team names and active releases count
      const transformedMembers: Member[] = (users as unknown as UserWithTeams[]).map((user) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        nickname: user.nickname,
        created_at: user.created_at,
        teams: user.team_users?.map((tu) => tu.teams.name) || [],
        active_releases: 0, // TODO: Calculate this from user_release_state
      }));

      setMembers(transformedMembers);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleMemberAdded = () => {
    fetchMembers(); // Refresh the list
  };

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} onMemberUpdated={handleMemberAdded} />
          ))}
        </div>
      )}
    </div>
  );
} 