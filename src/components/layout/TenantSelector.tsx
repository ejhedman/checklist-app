"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function TenantSelector() {
  const { availableTenants, selectedTenant, setSelectedTenant, user } = useAuth();
  const [open, setOpen] = useState(false);

  // Don't show selector if user is not logged in
  if (!user) {
    return null;
  }

  // Don't show selector if user has no tenants
  if (availableTenants.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>No projects available</span>
      </div>
    );
  }

  // Don't show selector if user has only one tenant (it's auto-selected)
  if (availableTenants.length === 1) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Building2 className="h-4 w-4" />
        <span>{selectedTenant?.name}</span>
      </div>
    );
  }

  // Show selector for users with multiple tenants
  return (
    <div className="flex items-center space-x-2">
      <Building2 className="h-4 w-4" />
      <Select
        value={selectedTenant?.id || ""}
        onValueChange={(value) => {
          const tenant = availableTenants.find(t => t.id === value);
          setSelectedTenant(tenant || null);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {availableTenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              {tenant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 