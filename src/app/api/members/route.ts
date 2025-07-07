import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { full_name, email, password, nickname, role } = await request.json();

    // Validate required fields
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name,
        nickname: nickname || null,
      },
    });

    if (authError) {
      // Handle specific auth errors
      if (authError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Add member to our members table
    const { error: dbError } = await supabase
      .from("members")
      .insert({
        id: authData.user.id,
        member_id: crypto.randomUUID(), // Generate a new member_id
        email,
        full_name,
        nickname: nickname || null,
        role: role || 'user',
      });

    if (dbError) {
      // If database insertion fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      // Handle specific database errors
      if (dbError.code === '23505' && dbError.message.includes('members_email_key')) {
        return NextResponse.json(
          { error: 'A member with this email already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      member: {
        id: authData.user.id,
        email,
        full_name,
        nickname: nickname || null,
        role: role || 'user',
      }
    });

  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 