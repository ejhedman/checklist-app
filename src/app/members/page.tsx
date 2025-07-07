"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Loader2 } from "lucide-react";
import { AddMemberDialog } from "@/components/members/AddMemberDialog";
import { createClient } from "@/lib/supabase";
import { MemberCard, Member } from "@/components/members/MemberCard";
import { useAuth } from "@/contexts/AuthContext";

type TeamMember = { teams: { name: string } };
type MemberWithTeams = {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  member_role: 'member' | 'release_manager' | 'admin';
  created_at: string;
  team_members?: TeamMember[];
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedTenant } = useAuth();

  const fetchMembers = async () => {
    try {
      const supabase = createClient();
      
      if (!selectedTenant) {
        console.error("No tenant selected");
        setMembers([]);
        setLoading(false);
        return;
      }
      
      // Fetch members with their team memberships (filtered by tenant)
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select(`
          id,
          full_name,
          email,
          nickname,
          member_role,
          created_at,
          team_members (
            teams (
              name
            )
          )
        `)
        .eq('tenant_id', selectedTenant.id)
        .order("full_name");

      if (membersError) {
        console.error("Error fetching members:", membersError);
        return;
      }

      // Transform the data to include team names and active releases count
      const transformedMembers: Member[] = (members as unknown as MemberWithTeams[]).map((member) => ({
        id: member.id,
        full_name: member.full_name,
        email: member.email,
        nickname: member.nickname,
        member_role: member.member_role,
        created_at: member.created_at,
        teams: member.team_members?.map((tm) => tm.teams.name) || [],
        active_releases: 0, // TODO: Calculate this from member_release_state
      }));

      setMembers(transformedMembers);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchMembers();
    } else {
      setMembers([]);
      setLoading(false);
    }
  }, [selectedTenant]);

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