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
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";

interface AddProjectDialogProps {
  onProjectAdded: () => void;
}

export function AddProjectDialog({ onProjectAdded }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    is_manage_members: true,
    is_manage_features: true,
  });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setFormData({
        name: "",
        is_manage_members: true,
        is_manage_features: true,
      });
      setError("");
      setNameError("");
    }
  };

  // Check if project name is unique
  const checkNameUniqueness = async (name: string) => {
    if (!name.trim()) {
      setNameError("");
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .ilike("name", name.trim())
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking name uniqueness:", error);
        return;
      }
      if (data) {
        setNameError("A project with this name already exists. Please choose a different name.");
      } else {
        setNameError("");
      }
    } catch (error) {
      console.error("Error checking name uniqueness:", error);
    }
  };

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
  }, [formData.name]);

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
      const { error: projectError } = await supabase
        .from("projects")
        .insert({
          name: formData.name,
          is_manage_members: formData.is_manage_members,
          is_manage_features: formData.is_manage_features,
        })
        .select()
        .single();
      if (projectError) {
        console.error("Error creating project:", projectError);
        if (projectError.code === '23505') {
          setError("A project with this name already exists. Please choose a different name.");
        } else {
          setError("Failed to create project: " + projectError.message);
        }
        return;
      }
      setOpen(false);
      onProjectAdded();
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
          aria-label="Add Project"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Create a new project for your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-4">
              <Label htmlFor="name" className="block w-full text-left">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`col-span-3 ${nameError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
                disabled={loading}
                placeholder="e.g., DWH, Production"
              />
            </div>
            {nameError && (
              <div className="col-span-4 text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
                {nameError}
              </div>
            )}
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-4">
              <Label htmlFor="is_manage_members" className="block w-full text-left">Manage Members</Label>
              <div className="col-span-3 flex items-center">
                <Checkbox
                  id="is_manage_members"
                  checked={formData.is_manage_members}
                  onCheckedChange={checked => setFormData({ ...formData, is_manage_members: Boolean(checked) })}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center gap-4">
              <Label htmlFor="is_manage_features" className="block w-full text-left">Manage Features</Label>
              <div className="col-span-3 flex items-center">
                <Checkbox
                  id="is_manage_features"
                  checked={formData.is_manage_features}
                  onCheckedChange={checked => setFormData({ ...formData, is_manage_features: Boolean(checked) })}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
              {error}
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
            <Button type="submit" disabled={loading || !!nameError}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 