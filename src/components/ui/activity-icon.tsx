import { UserCheck, Zap, PlusCircle, Plus, Users2, Settings, CheckCircle } from "lucide-react";

export interface ActivityIconProps {
  activityType: string;
  className?: string;
  size?: number;
}

export function ActivityIcon({ activityType, className = "", size = 16 }: ActivityIconProps) {
  const iconConfig = getActivityIconConfig(activityType);
  const IconComponent = iconConfig.icon;
  
  return (
    <IconComponent 
      className={`${iconConfig.color} ${className}`} 
      size={size}
    />
  );
}

function getActivityIconConfig(activityType: string) {
  switch (activityType) {
    case 'member_ready':
      return { icon: UserCheck, color: 'text-green-500' };
    case 'feature_ready':
      return { icon: Zap, color: 'text-blue-500' };
    case 'release_created':
      return { icon: PlusCircle, color: 'text-purple-500' };
    case 'feature_added':
      return { icon: Plus, color: 'text-orange-500' };
    case 'team_added':
      return { icon: Users2, color: 'text-indigo-500' };
    case 'release_state_change':
      return { icon: Settings, color: 'text-yellow-500' };
    default:
      return { icon: CheckCircle, color: 'text-gray-500' };
  }
} 