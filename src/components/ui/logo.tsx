import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
  responsive?: boolean;
}

const sizeClasses = {
  sm: "h-6",
  md: "h-8", 
  lg: "h-12",
  xl: "h-16"
};

const responsiveClasses = {
  sm: "h-4 sm:h-6",
  md: "h-6 sm:h-8", 
  lg: "h-8 sm:h-12",
  xl: "h-12 sm:h-16"
};

export function Logo({ 
  className, 
  size = "md", 
  priority = false, 
  responsive = false 
}: LogoProps) {
  const heightClass = responsive ? responsiveClasses[size] : sizeClasses[size];
  
  return (
    <div className={cn("flex items-center", className)}>
      <Image 
        src="/logo.png" 
        alt="Releassimo Logo" 
        width={1024}
        height={334}
        className={cn(
          "w-auto object-contain",
          heightClass
        )}
        priority={priority}
        quality={100}
        style={{
          imageRendering: 'crisp-edges',
        }}
      />
    </div>
  );
} 