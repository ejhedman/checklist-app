"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { Member } from "./MemberCard";
import { useMembers } from "@/hooks/useMembers";

export function EditMemberDialog({ member, onMemberUpdated }: { member: Member; onMemberUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nickname: member.nickname || "",
    member_role: member.member_role || "member" as "member" | "release_manager" | "admin",
  });

  const { members } = useMembers();
  const [nicknameError, setNicknameError] = useState("");

  useEffect(() => {
    if (!formData.nickname.trim() || !members) {
      setNicknameError("");
      return;
    }
    const nicknameTaken = members.some(
      (m) => m.id !== member.id && m.nickname && m.nickname.toLowerCase() === formData.nickname.trim().toLowerCase()
    );
    setNicknameError(nicknameTaken ? "This nickname is already used by another member in this project." : "");
  }, [formData.nickname, members, member.id]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData({
        nickname: member.nickname || "",
        member_role: member.member_role || "member",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nicknameError) {
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Debug logging
      // console.log('Updating member:', member.id);
      // console.log('New data:', {
      //   nickname: formData.nickname || null,
      //   member_role: formData.member_role,
      // });
      
      const { error } = await supabase
        .from("members")
        .update({
          nickname: formData.nickname || null,
          member_role: formData.member_role,
        })
        .eq("id", member.id)
        .select();
        
      if (error) {
        console.error('Update error:', error);
        alert("Failed to update member: " + error.message);
        return;
      }
      
      // console.log('Update successful:', data);
      setOpen(false);
      onMemberUpdated();
    } catch (error) {
      console.error('Unexpected error:', error);
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="border border-gray-300 rounded-md p-1 hover:bg-blue-100 hover:text-blue-600">
          <Edit className="h-4 w-4 text-blue-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Update the details for this team member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Full Name
              </Label>
              <div className="col-span-3 text-sm text-muted-foreground">
                {member.full_name}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Email
              </Label>
              <div className="col-span-3 text-sm text-muted-foreground">
                {member.email}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                Nickname
              </Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className={nicknameError ? "col-span-3 border-red-500" : "col-span-3"}
                placeholder="Optional nickname"
              />
              {nicknameError && (
                <div className="col-span-4 text-red-600 text-xs mt-1">{nicknameError}</div>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member_role" className="text-right">
                Role *
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.member_role}
                  onValueChange={(value: "member" | "release_manager" | "admin") =>
                    setFormData({ ...formData, member_role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="release_manager">Release Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!nicknameError}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 