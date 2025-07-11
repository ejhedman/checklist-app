import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AuthRepository } from "@/lib/repository"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get current user's member info
export async function getCurrentMemberInfo() {
  const authRepository = new AuthRepository();
  
  try {
    return await authRepository.getCurrentMemberInfo();
  } catch (error) {
    console.error("Error getting current member info:", error);
    return null;
  }
}

// Format a YYYY-MM-DD string as M/D/YYYY
export function formatTargetDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return `${month}/${day}/${year}`;
}

// Calculate days until a YYYY-MM-DD date, using local time
export function getDaysUntil(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
