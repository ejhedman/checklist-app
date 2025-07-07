import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const { password } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // First, check if the member exists in our members table
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, email")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      console.error('Member not found in members table:', memberId, memberError);
      return NextResponse.json(
        { error: 'Member not found in database' },
        { status: 404 }
      );
    }

    // Check if the user exists in auth.users table
    const { data: authUser, error: authCheckError } = await supabase.auth.admin.getUserById(memberId);
    
    if (authCheckError || !authUser.user) {
      console.error('User not found in auth.users table:', memberId, authCheckError);
      return NextResponse.json(
        { error: 'User not found in authentication system' },
        { status: 404 }
      );
    }

    // Update the user's password in Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      memberId,
      { password }
    );

    if (authError) {
      console.error('Error updating password:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 