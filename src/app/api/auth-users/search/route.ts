import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || email.length < 2) {
      return NextResponse.json(
        { error: 'Email search term must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Search for auth users by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // Filter and transform the results
    const filteredUsers = authUsers.users
      .filter(user => 
        user.email && 
        user.email.toLowerCase().includes(email.toLowerCase()) &&
        user.email_confirmed_at // Only confirmed users
      )
      .map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email || 'Unknown',
        created_at: user.created_at
      }))
      .slice(0, 10); // Limit to 10 results

    return NextResponse.json(filteredUsers);

  } catch (error) {
    console.error('Error searching auth users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 