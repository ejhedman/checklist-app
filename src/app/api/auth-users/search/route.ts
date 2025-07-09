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
    const projectId = searchParams.get('projectId');

    console.log('API Search - Email:', email);
    console.log('API Search - Project ID:', projectId);

    if (!projectId) {
      console.log('API Search - Project ID missing');
      return NextResponse.json(
        { error: 'Project ID is required' },
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

    console.log('API Search - Total auth users found:', authUsers.users.length);

    // Get existing members for this project to exclude them
    const { data: existingMembers, error: membersError } = await supabase
      .from('members')
      .select('user_id')
      .eq('project_id', projectId);

    if (membersError) {
      console.error('Error fetching existing members:', membersError);
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 }
      );
    }

    console.log('API Search - Existing members for project:', existingMembers?.length || 0);
    console.log('API Search - Existing member user IDs:', existingMembers?.map(m => m.user_id) || []);

    // Create a set of existing member user IDs for quick lookup
    const existingMemberIds = new Set(existingMembers?.map(m => m.user_id) || []);

    // Filter and transform the results
    const filteredUsers = authUsers.users
      .filter(user => 
        user.email && 
        (!email || email.length < 2 || user.email.toLowerCase().includes(email.toLowerCase())) &&
        !existingMemberIds.has(user.id) // Exclude users who are already members
      )
      .map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email || 'Unknown',
        created_at: user.created_at
      }))
      .slice(0, 10); // Limit to 10 results

    console.log('API Search - Filtered users after email match:', authUsers.users.filter(user => 
      user.email && (!email || email.length < 2 || user.email.toLowerCase().includes(email.toLowerCase()))
    ).length);
    console.log('API Search - Final filtered users (excluding existing members):', filteredUsers.length);
    console.log('API Search - Final users:', filteredUsers);

    return NextResponse.json(filteredUsers);

  } catch (error) {
    console.error('Error searching auth users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 