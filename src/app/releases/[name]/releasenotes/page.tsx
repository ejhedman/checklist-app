"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Pencil, Save, X, Copy, ClipboardPaste, FileText, FileCode2, FileType2 } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { marked } from "marked";
import { useToast } from "@/components/ui/toast";

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
  const [summaryPopoverOpen, setSummaryPopoverOpen] = useState(false);
  const [notesPopoverOpen, setNotesPopoverOpen] = useState(false);
  const [summaryDownloadOpen, setSummaryDownloadOpen] = useState(false);
  const [notesDownloadOpen, setNotesDownloadOpen] = useState(false);
  const [summaryPasteOpen, setSummaryPasteOpen] = useState(false);
  const [notesPasteOpen, setNotesPasteOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchReleaseNotes = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      // Get current user's member info for project filtering
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("No authenticated user found");
        setLoading(false);
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('project_id')
        .eq('email', user.email)
        .single();

      if (memberError || !member) {
        setError("No member record found for user");
        setLoading(false);
        return;
      }
      
      // Find release by name (slug) and project
      const { data, error } = await supabase
        .from("releases")
        .select("id, release_notes, release_summary")
        .eq("name", decodeURIComponent(name as string))
        .eq("project_id", member.project_id)
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
      .select('id, project_id')
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
        project_id: member.project_id,
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
      .select('id, project_id')
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
        project_id: member.project_id,
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

  // Clipboard handlers
  const handleCopySummaryMarkdown = async () => {
    await navigator.clipboard.writeText(releaseSummary || "");
    setSummaryPopoverOpen(false);
    addToast("Copied summary as markdown to clipboard!", "success");
  };
  const handleCopySummaryRich = async () => {
    let html = marked.parse(releaseSummary || "");
    if (html instanceof Promise) html = await html;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    try {
      document.execCommand("copy");
    } finally {
      selection?.removeAllRanges();
      document.body.removeChild(tempDiv);
    }
    setSummaryPopoverOpen(false);
    addToast("Copied summary as rich text to clipboard!", "success");
  };
  const handleCopySummaryPlain = async () => {
    let html = marked.parse(releaseSummary || "");
    if (html instanceof Promise) html = await html;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    await navigator.clipboard.writeText(text);
    setSummaryPopoverOpen(false);
    addToast("Copied summary as plain text to clipboard!", "success");
  };
  const handlePasteSummaryPlain = async () => {
    const text = await navigator.clipboard.readText();
    setReleaseSummary(text);
    if (!editingSummary) setEditingSummary(true);
    setSummaryPasteOpen(false);
    addToast("Pasted summary as plain text!", "success");
  };
  
  const handlePasteSummaryFormatted = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      let formattedText = "";
      
      for (const clipboardItem of clipboardItems) {
        if (clipboardItem.types.includes('text/html')) {
          const htmlBlob = await clipboardItem.getType('text/html');
          const html = await htmlBlob.text();
          // Convert HTML to markdown (simple conversion)
          formattedText = html
            .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '# $1\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
          break;
        } else if (clipboardItem.types.includes('text/plain')) {
          const textBlob = await clipboardItem.getType('text/plain');
          formattedText = await textBlob.text();
          break;
        }
      }
      
      if (formattedText) {
        setReleaseSummary(formattedText);
        if (!editingSummary) setEditingSummary(true);
        setSummaryPasteOpen(false);
        addToast("Pasted summary as formatted text!", "success");
      } else {
        addToast("No formatted content found in clipboard", "error");
      }
    } catch (error) {
      console.error('Error reading formatted clipboard:', error);
      addToast("Failed to read formatted content from clipboard", "error");
    }
  };
  const handleCopyNotesMarkdown = async () => {
    await navigator.clipboard.writeText(releaseNotes || "");
    setNotesPopoverOpen(false);
    addToast("Copied release notes as markdown to clipboard!", "success");
  };
  const handleCopyNotesRich = async () => {
    let html = marked.parse(releaseNotes || "");
    if (html instanceof Promise) html = await html;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    try {
      document.execCommand("copy");
    } finally {
      selection?.removeAllRanges();
      document.body.removeChild(tempDiv);
    }
    setNotesPopoverOpen(false);
    addToast("Copied release notes as rich text to clipboard!", "success");
  };
  const handleCopyNotesPlain = async () => {
    let html = marked.parse(releaseNotes || "");
    if (html instanceof Promise) html = await html;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    await navigator.clipboard.writeText(text);
    setNotesPopoverOpen(false);
    addToast("Copied release notes as plain text to clipboard!", "success");
  };
  const handlePasteNotesPlain = async () => {
    const text = await navigator.clipboard.readText();
    setReleaseNotes(text);
    if (!editing) setEditing(true);
    setNotesPasteOpen(false);
    addToast("Pasted release notes as plain text!", "success");
  };
  
  const handlePasteNotesFormatted = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      let formattedText = "";
      
      for (const clipboardItem of clipboardItems) {
        if (clipboardItem.types.includes('text/html')) {
          const htmlBlob = await clipboardItem.getType('text/html');
          const html = await htmlBlob.text();
          // Convert HTML to markdown (simple conversion)
          formattedText = html
            .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '# $1\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
          break;
        } else if (clipboardItem.types.includes('text/plain')) {
          const textBlob = await clipboardItem.getType('text/plain');
          formattedText = await textBlob.text();
          break;
        }
      }
      
      if (formattedText) {
        setReleaseNotes(formattedText);
        if (!editing) setEditing(true);
        setNotesPasteOpen(false);
        addToast("Pasted release notes as formatted text!", "success");
      } else {
        addToast("No formatted content found in clipboard", "error");
      }
    } catch (error) {
      console.error('Error reading formatted clipboard:', error);
      addToast("Failed to read formatted content from clipboard", "error");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading release notes...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Release Summary Card */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Release Summary</CardTitle>
            <div className="flex gap-2">
              <Popover open={summaryDownloadOpen} onOpenChange={setSummaryDownloadOpen}>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="bg-white" title="Copy summary to clipboard">
                    <Copy className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="flex flex-col">
                    <button
                      className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => { handleCopySummaryPlain(); setSummaryDownloadOpen(false); }}
                    >
                      <FileText className="h-4 w-4 mr-2" /> Copy as Plain Text
                    </button>
                    <button
                      className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => { handleCopySummaryMarkdown(); setSummaryDownloadOpen(false); }}
                    >
                      <FileCode2 className="h-4 w-4 mr-2" /> Copy as Markdown
                    </button>
                    <button
                      className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => { handleCopySummaryRich(); setSummaryDownloadOpen(false); }}
                    >
                      <FileType2 className="h-4 w-4 mr-2" /> Copy as Rich Text
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover open={summaryPasteOpen} onOpenChange={setSummaryPasteOpen}>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="bg-white" title="Paste from clipboard">
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="flex flex-col">
                    <button
                      className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={handlePasteSummaryPlain}
                    >
                      <FileText className="h-4 w-4 mr-2" /> Paste as Plain Text
                    </button>
                    <button
                      className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={handlePasteSummaryFormatted}
                    >
                      <FileType2 className="h-4 w-4 mr-2" /> Paste as Formatted Text
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              {!editingSummary && (
                <Button size="icon" variant="ghost" className="bg-white" onClick={() => setEditingSummary(true)} title="Edit Summary">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
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
              <div className="flex gap-2 mt-2 mb-4">
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
        </CardContent>
      </Card>

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
          <div className="mb-4" />
        </div>
      ) : (
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Release Notes</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">Release notes for {name}</p>
              </div>
              <div className="flex gap-2">
                <Popover open={notesDownloadOpen} onOpenChange={setNotesDownloadOpen}>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="bg-white" title="Copy release notes to clipboard">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0">
                    <div className="flex flex-col">
                      <button
                        className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => { handleCopyNotesPlain(); setNotesDownloadOpen(false); }}
                      >
                        <FileText className="h-4 w-4 mr-2" /> Copy as Plain Text
                      </button>
                      <button
                        className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => { handleCopyNotesMarkdown(); setNotesDownloadOpen(false); }}
                      >
                        <FileCode2 className="h-4 w-4 mr-2" /> Copy as Markdown
                      </button>
                      <button
                        className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => { handleCopyNotesRich(); setNotesDownloadOpen(false); }}
                      >
                        <FileType2 className="h-4 w-4 mr-2" /> Copy as Rich Text
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover open={notesPasteOpen} onOpenChange={setNotesPasteOpen}>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="bg-white" title="Paste from clipboard">
                      <ClipboardPaste className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0">
                    <div className="flex flex-col">
                      <button
                        className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={handlePasteNotesPlain}
                      >
                        <FileText className="h-4 w-4 mr-2" /> Paste as Plain Text
                      </button>
                      <button
                        className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={handlePasteNotesFormatted}
                      >
                        <FileType2 className="h-4 w-4 mr-2" /> Paste as Formatted Text
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button onClick={() => setEditing(true)} disabled={saving} size="icon" variant="ghost" className="bg-white" title="Edit Release Notes">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="prose prose-sm max-w-none">
              {releaseNotes ? (
                <ReactMarkdown>{releaseNotes}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">No release notes available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 