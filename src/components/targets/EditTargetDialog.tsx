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
import { Pencil, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Target } from "./TargetCard";

interface EditTargetDialogProps {
  target: Target;
  onTargetUpdated: () => void;
}

export function EditTargetDialog({ target, onTargetUpdated }: EditTargetDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    short_name: target.short_name,
    name: target.name,
    is_live: target.is_live,
  });
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [isCheckingName, setIsCheckingName] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form to current values
      setFormData({
        short_name: target.short_name,
        name: target.name,
        is_live: target.is_live,
      });
      setError("");
    }
  };

  // Check if target name is unique (excluding this target)
  const checkNameUniqueness = useCallback(async (name: string) => {
    if (!name.trim()) {
      setNameError("");
      return;
    }
    setIsCheckingName(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("targets")
        .select("id, name")
        .ilike("name", name.trim())
        .neq("id", target.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
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
    } finally {
      setIsCheckingName(false);
    }
  }, [target.id]);
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

      // Update target
      const { error: targetError } = await supabase
        .from("targets")
        .update({
          short_name: formData.short_name,
          name: formData.name,
          is_live: formData.is_live,
        })
        .eq("id", target.id)
        .select()
        .single();

      if (targetError) {
        console.error("Error updating target:", targetError);
        if (targetError.code === '23505') {
          setError("A target with this short name already exists. Please choose a different short name.");
        } else {
          setError("Failed to update target: " + targetError.message);
        }
        return;
      }

      setOpen(false);
      onTargetUpdated();
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
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Target</DialogTitle>
          <DialogDescription>
            Update target information.
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
                className="col-span-3"
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
                  Updating...
                </>
              ) : (
                "Update Target"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 