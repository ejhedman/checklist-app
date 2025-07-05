"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Loader2 } from "lucide-react";
import { AddMemberDialog } from "@/components/members/AddMemberDialog";
import { createClient } from "@/lib/supabase";

interface Member {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  created_at: string;
  teams: string[];
  active_releases: number;
}

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
      const transformedMembers: Member[] = users.map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        nickname: user.nickname,
        created_at: user.created_at,
        teams: user.team_users?.map((tu: any) => tu.teams.name) || [],
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
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {member.full_name}
                  </CardTitle>
                </div>
                <CardDescription className="flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {member.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {member.nickname && (
                    <div>
                      <p className="text-sm text-muted-foreground">Nickname</p>
                      <p className="font-medium">{member.nickname}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Teams</p>
                    <div className="flex flex-wrap gap-1 mt-1">
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Active Releases</p>
                      <p className="text-lg font-semibold">{member.active_releases}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-muted-foreground">Joined</p>
                      <p className="text-sm">{new Date(member.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 