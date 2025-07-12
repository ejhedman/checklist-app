import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Trash2 } from "lucide-react";
import { EditTargetDialog } from "./EditTargetDialog";
import { Button } from "@/components/ui/button";

export interface Target {
  id: string;
  short_name: string;
  name: string;
  is_live: boolean;
  created_at: string;
}

interface TargetCardProps {
  target: Target;
  onTargetUpdated: () => void;
}

export function TargetCard({ target, onTargetUpdated }: TargetCardProps) {
  return (
    <Card className={target.is_live ? "bg-green-50 border-green-200" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          {target.name}
        </CardTitle>
          <div className="flex items-center space-x-1">
            <EditTargetDialog target={target} onTargetUpdated={onTargetUpdated} />
            <Button 
              variant="ghost" 
              size="icon" 
              className="border border-gray-300 rounded-md p-1 hover:bg-red-100 hover:text-red-600"
              aria-label="Delete Target"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        <CardDescription>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{target.short_name}</span>
            {target.is_live && (
              <Badge variant="default" className="bg-green-600">
                Live
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Content removed as requested */}
      </CardContent>
    </Card>
  );
} 