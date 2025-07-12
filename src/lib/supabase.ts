import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { cookies } = require('next/headers');
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: async () => {
            const cookieStore = await cookies();
            return cookieStore.getAll();
          },
          // setAll: (_newCookies: { name: string; value: string; options?: any }[]) => {
          //   // No-op in server components; implement in API routes/middleware if needed
          // },
        },
      }
    )
  }
  // Client-side
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 