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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Briefcase, AlertCircle } from "lucide-react";
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
      <TooltipProvider>
        <div className="flex items-center space-x-2 text-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Briefcase className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Selected Project</p>
            </TooltipContent>
          </Tooltip>
          <span>{selectedTenant?.name}</span>
        </div>
      </TooltipProvider>
    );
  }

  // Show selector for users with multiple tenants
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Briefcase className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Selected Project</p>
          </TooltipContent>
        </Tooltip>
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
    </TooltipProvider>
  );
} 