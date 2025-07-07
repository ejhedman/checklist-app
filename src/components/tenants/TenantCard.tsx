import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Trash2 } from "lucide-react";
import { EditTenantDialog } from "./EditTenantDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  users?: Array<{
    id: string;
    email: string;
    full_name: string;
  }>;
}

interface TenantCardProps {
  tenant: Tenant;
  onTenantUpdated: () => void;
}

export function TenantCard({ tenant, onTenantUpdated }: TenantCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the tenant "${tenant.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenant.id);

      if (error) {
        console.error("Error deleting tenant:", error);
        alert("Failed to delete tenant: " + error.message);
        return;
      }

      onTenantUpdated();
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred while deleting the tenant");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            {tenant.name}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <EditTenantDialog tenant={tenant} onTenantUpdated={onTenantUpdated} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Created: {new Date(tenant.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {tenant.users && tenant.users.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Associated Users:</h4>
            <div className="space-y-1 pl-4">
              {tenant.users.map((user) => (
                <div key={user.id} className="text-sm text-muted-foreground">
                  {user.email} ({user.full_name})
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No users associated with this tenant
          </div>
        )}
      </CardContent>
    </Card>
  );
} 