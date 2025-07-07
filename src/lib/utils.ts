import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createClient } from "@/lib/supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get current user's member info
export async function getCurrentMemberInfo() {
  const supabase = createClient();
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    // Get the member record for this user
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, member_id, tenant_id, full_name, email')
      .eq('email', user.email)
      .single();

    if (memberError || !member) {
      return null;
    }

    return member;
  } catch (error) {
    console.error("Error getting current member info:", error);
    return null;
  }
}
