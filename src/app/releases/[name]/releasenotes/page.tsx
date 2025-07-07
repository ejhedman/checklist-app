"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Pencil, Save, X } from "lucide-react";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function ReleaseNotesPage() {
  const { name } = useParams();
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [releaseSummary, setReleaseSummary] = useState<string>("");
  const [editingSummary, setEditingSummary] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);

  useEffect(() => {
    const fetchReleaseNotes = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      // Get current user's member info for tenant filtering
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("No authenticated user found");
        setLoading(false);
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('tenant_id')
        .eq('email', user.email)
        .single();

      if (memberError || !member) {
        setError("No member record found for user");
        setLoading(false);
        return;
      }
      
      // Find release by name (slug) and tenant
      const { data, error } = await supabase
        .from("releases")
        .select("id, release_notes, release_summary")
        .eq("name", decodeURIComponent(name as string))
        .eq("tenant_id", member.tenant_id)
        .single();
      if (error) {
        setError("Release not found");
        setLoading(false);
        return;
      }
      setReleaseId(data.id);
      setReleaseNotes(data.release_notes || "");
      setReleaseSummary(data.release_summary || "");
      setLoading(false);
    };
    fetchReleaseNotes();
  }, [name]);

  const handleSave = async () => {
    if (!releaseId) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    
    // Get current user's member info for activity logging
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("No authenticated user found");
      setSaving(false);
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, tenant_id')
      .eq('email', user.email)
      .single();

    if (memberError || !member) {
      setError("No member record found for user");
      setSaving(false);
      return;
    }
    
    const { error } = await supabase
      .from("releases")
      .update({ release_notes: releaseNotes })
      .eq("id", releaseId);
    if (error) {
      setError("Failed to save release notes");
    } else {
      // Log activity: release notes updated
      const { error: activityError } = await supabase.from("activity_log").insert({
        release_id: releaseId,
        member_id: member.id,
        tenant_id: member.tenant_id,
        activity_type: "release_notes_updated",
        activity_details: { 
          method: "manual_edit"
        },
      });
      if (activityError) {
        console.error("Failed to log release notes update activity:", activityError);
      } else {
        // console.log("Successfully logged release notes update activity");
      }
      
      setEditing(false);
    }
    setSaving(false);
  };

  const handleSaveSummary = async () => {
    if (!releaseId) return;
    setSavingSummary(true);
    setError(null);
    const supabase = createClient();
    
    // Get current user's member info for activity logging
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("No authenticated user found");
      setSavingSummary(false);
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, tenant_id')
      .eq('email', user.email)
      .single();

    if (memberError || !member) {
      setError("No member record found for user");
      setSavingSummary(false);
      return;
    }
    
    const { error } = await supabase
      .from("releases")
      .update({ release_summary: releaseSummary })
      .eq("id", releaseId);
    if (error) {
      setError("Failed to save release summary");
    } else {
      // Log activity: release summary updated
      const { error: activityError } = await supabase.from("activity_log").insert({
        release_id: releaseId,
        member_id: member.id,
        tenant_id: member.tenant_id,
        activity_type: "release_summary_updated",
        activity_details: { 
          method: "manual_edit"
        },
      });
      if (activityError) {
        console.error("Failed to log release summary update activity:", activityError);
      } else {
        // console.log("Successfully logged release summary update activity");
      }
      
      setEditingSummary(false);
    }
    setSavingSummary(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading release notes...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Release Summary Section */}
      <div className="border border-border bg-background p-4 rounded-md mb-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Release Summary</h2>
          {!editingSummary && (
            <Button size="sm" variant="outline" onClick={() => setEditingSummary(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit Summary
            </Button>
          )}
        </div>
        {editingSummary ? (
          <div className="space-y-2">
            <MDEditor
              value={releaseSummary}
              onChange={v => setReleaseSummary(v ?? "")}
              preview="edit"
              height={120}
              textareaProps={{
                placeholder: "Write a short summary for this release (markdown supported)...",
                style: { fontSize: 16 },
              }}
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => setEditingSummary(false)} disabled={savingSummary}>Cancel</Button>
              <Button size="sm" variant="default" onClick={handleSaveSummary} disabled={savingSummary}>Save</Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            {releaseSummary ? (
              <ReactMarkdown>{releaseSummary}</ReactMarkdown>
            ) : (
              <span className="text-muted-foreground">No summary provided.</span>
            )}
          </div>
        )}
      </div>
      {editing ? (
        <div className="border-l border-r border-b border-border bg-background p-6 flex flex-col min-h-[60vh]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Edit Release Notes</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setEditing(false)} title="Cancel">
                <X className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" onClick={() => setShowResetDialog(true)} title="Reset to Template">
                ↺
              </Button>
              <Button variant="default" size="icon" onClick={handleSave} disabled={saving} title="Save">
                <Save className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Release Notes?</DialogTitle>
                <DialogDescription>
                  This will discard your current release notes and reset them to the template. Are you sure you want to continue?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    const res = await fetch('/docs/release-notes-template.md');
                    const text = await res.text();
                    setReleaseNotes(text);
                    setShowResetDialog(false);
                  }}
                >
                  OK
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex-1 min-h-0">
            <MDEditor
              value={releaseNotes}
              onChange={v => setReleaseNotes(v ?? "")}
              height={"100%"}
              preview="edit"
              textareaProps={{
                placeholder: "Write release notes in markdown...",
                style: { fontSize: 16, minHeight: "100%" },
              }}
              style={{ height: "100%" }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Release Notes</h1>
              <p className="text-muted-foreground">Release notes for {name}</p>
            </div>
            <Button onClick={() => setEditing(true)} disabled={saving}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="prose prose-sm max-w-none">
            {releaseNotes ? (
              <ReactMarkdown>{releaseNotes}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">No release notes available.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
} 