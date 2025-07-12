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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AddTargetDialogProps {
  onTargetAdded: () => void;
}

export function AddTargetDialog({ onTargetAdded }: AddTargetDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    short_name: "",
    name: "",
    is_live: false,
  });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [shortNameError, setShortNameError] = useState("");
  const { selectedProject } = useAuth();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form
      setFormData({
        short_name: "",
        name: "",
        is_live: false,
      });
      setError("");
      setNameError("");
      setShortNameError("");
    }
  };

  // Check if target name is unique within the project
  const checkNameUniqueness = useCallback(async (name: string) => {
    if (!name.trim() || !selectedProject) {
      setNameError("");
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("targets")
        .select("id, name")
        .eq("project_id", selectedProject.id)
        .ilike("name", name.trim())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Error checking name uniqueness:", error);
        return;
      }

      if (data) {
        setNameError("A target with this name already exists in this project. Please choose a different name.");
      } else {
        setNameError("");
      }
    } catch (error) {
      console.error("Error checking name uniqueness:", error);
    }
  }, [selectedProject]);

  // Check if target short_name is unique within the project
  const checkShortNameUniqueness = useCallback(async (shortName: string) => {
    if (!shortName.trim() || !selectedProject) {
      setShortNameError("");
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("targets")
        .select("id, short_name")
        .eq("project_id", selectedProject.id)
        .ilike("short_name", shortName.trim())
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking short_name uniqueness:", error);
        return;
      }
      if (data) {
        setShortNameError("A target with this short name already exists in this project. Please choose a different short name.");
      } else {
        setShortNameError("");
      }
    } catch (error) {
      console.error("Error checking short_name uniqueness:", error);
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
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [formData.name, checkNameUniqueness]);

  // Debounced short_name validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.short_name.trim()) {
        checkShortNameUniqueness(formData.short_name);
      } else {
        setShortNameError("");
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.short_name, checkShortNameUniqueness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for name and short_name uniqueness before submitting
    if (formData.name.trim()) {
      await checkNameUniqueness(formData.name);
      if (nameError) {
        return; // Don't submit if name is not unique
      }
    }
    if (formData.short_name.trim()) {
      await checkShortNameUniqueness(formData.short_name);
      if (shortNameError) {
        return; // Don't submit if short_name is not unique
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

      // Insert new target
      const { error: targetError } = await supabase
        .from("targets")
        .insert({
          short_name: formData.short_name,
          name: formData.name,
          is_live: formData.is_live,
          project_id: selectedProject.id,
        })
        .select()
        .single();

      if (targetError) {
        console.error("Error creating target:", targetError);
        if (targetError.code === '23505') {
          setError("A target with this short name already exists. Please choose a different short name.");
        } else {
          setError("Failed to create target: " + targetError.message);
        }
        return;
      }

      setOpen(false);
      onTargetAdded();
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Target
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Target</DialogTitle>
          <DialogDescription>
            Create a new target for your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="short_name" className="text-right">
                Short Name *
              </Label>
              <Input
                id="short_name"
                value={formData.short_name}
                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                className={`col-span-3 ${shortNameError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
                disabled={loading}
                placeholder="e.g., acme, corp"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`col-span-3 ${nameError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
                disabled={loading}
                placeholder="e.g., Acme Corporation"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-4 flex items-center space-x-2">
                <Checkbox
                  id="is_live"
                  checked={formData.is_live}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_live: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label htmlFor="is_live">Mark as live target</Label>
              </div>
            </div>
          </div>
          {(nameError || shortNameError || error) && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
              {nameError || shortNameError || error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!nameError || !!shortNameError}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Target"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 