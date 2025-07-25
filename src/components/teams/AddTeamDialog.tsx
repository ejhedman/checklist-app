"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AddTeamDialogProps {
  onTeamAdded: () => void;
}

export function AddTeamDialog({ onTeamAdded }: AddTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const { selectedProject } = useAuth();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form
      setFormData({
        name: "",
        description: "",
      });
      setError("");
    }
  };

  // Check if team name is unique within the project
  const checkNameUniqueness = useCallback(async (name: string) => {
    if (!name.trim() || !selectedProject) {
      setNameError("");
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .eq("project_id", selectedProject.id)
        .ilike("name", name.trim())
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking name uniqueness:", error);
        return;
      }
      if (data) {
        setNameError("A team with this name already exists in this project. Please choose a different name.");
      } else {
        setNameError("");
      }
    } catch (error) {
      console.error("Error checking name uniqueness:", error);
    }
  }, [selectedProject]);
  // Debounced name validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name.trim()) {
        checkNameUniqueness(formData.name);
      } else {
        setNameError("");
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.name, checkNameUniqueness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check for name uniqueness before submitting
    if (formData.name.trim()) {
      await checkNameUniqueness(formData.name);
      if (nameError) {
        return;
      }
    }
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      if (!selectedProject) {
        setError("Please select a project first");
        setLoading(false);
        return;
      }

      // Insert new team
      const { error: teamError } = await supabase
        .from("teams")
        .insert({
          name: formData.name,
          description: formData.description || null,
          project_id: selectedProject.id,
        })
        .select()
        .single();

      if (teamError) {
        console.error("Error creating team:", teamError);
        if (teamError.code === '23505') {
          setError("A team with this name already exists. Please choose a different name.");
        } else {
          setError("Failed to create team: " + teamError.message);
        }
        return;
      }

      setOpen(false);
      onTeamAdded();
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="border border-gray-300 rounded-md p-1 hover:bg-gray-100"
          aria-label="Add Team"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
          <DialogDescription>
            Create a new team for your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-4">
              <Label htmlFor="name" className="block w-full text-left">Team Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`col-span-3 ${nameError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
                disabled={loading}
                placeholder="e.g., Frontend Team"
              />
            </div>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-4">
              <Label htmlFor="description" className="block w-full text-left">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                disabled={loading}
                placeholder="Brief description of the team's responsibilities"
                rows={3}
              />
            </div>
            {(nameError || error) && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
                {nameError || error}
              </div>
            )}
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Team"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 