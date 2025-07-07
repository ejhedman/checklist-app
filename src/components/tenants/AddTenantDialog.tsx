"use client";

import { useState } from "react";
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

interface AddTenantDialogProps {
  onTenantAdded: () => void;
}

export function AddTenantDialog({ onTenantAdded }: AddTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [error, setError] = useState("");

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form
      setFormData({
        name: "",
      });
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Insert new tenant
      const { error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: formData.name,
        })
        .select()
        .single();

      if (tenantError) {
        console.error("Error creating tenant:", tenantError);
        if (tenantError.code === '23505') {
          setError("A tenant with this name already exists. Please choose a different name.");
        } else {
          setError("Failed to create tenant: " + tenantError.message);
        }
        return;
      }

      setOpen(false);
      onTenantAdded();
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
          New Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
          <DialogDescription>
            Create a new tenant for your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
                disabled={loading}
                placeholder="e.g., DWH, Production"
              />
            </div>
            {error && (
              <div className="col-span-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
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
                "Add Tenant"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 