"use client";

import { useState, useEffect } from "react";
import { AddTenantDialog } from "@/components/tenants/AddTenantDialog";
import { createClient } from "@/lib/supabase";
import { TenantCard, Tenant } from "@/components/tenants/TenantCard";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("tenants")
      .select(`
        id,
        name,
        created_at,
        tenant_user_map(
          user_id,
          members(
            user_id,
            email,
            full_name
          )
        )
      `)
      .order("name");

    if (error) {
      console.error("Error fetching tenants:", error);
    } else {
      // Transform the data to flatten the user structure
      const transformedData = data?.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        created_at: tenant.created_at,
        users: tenant.tenant_user_map?.filter((mapping: any) => mapping.members)?.map((mapping: any) => ({
          id: mapping.members.user_id,
          email: mapping.members.email,
          full_name: mapping.members.full_name
        })) || []
      })) || [];
      
      setTenants(transformedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage projects and their configurations
          </p>
        </div>
        <AddTenantDialog onTenantAdded={fetchTenants} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onTenantUpdated={fetchTenants}
            />
          ))}
        </div>
      )}
    </div>
  );
} 