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
