import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch all users from Supabase auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // Fetch user roles from uroles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('uroles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return NextResponse.json(
        { error: rolesError.message },
        { status: 500 }
      );
    }

    // Create a map of user_id to role for quick lookup
    const roleMap = new Map();
    userRoles?.forEach(userRole => {
      roleMap.set(userRole.user_id, userRole.role);
    });

    // Transform auth users to our User interface
    const transformedUsers = authUsers.users.map((authUser) => ({
      id: authUser.id,
      email: authUser.email || '',
      full_name: authUser.user_metadata?.full_name || authUser.email || 'Unknown',
      nickname: authUser.user_metadata?.nickname || null,
      role: authUser.user_metadata?.role || 'user',
      created_at: authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at,
      app_role: roleMap.get(authUser.id) || 'user', // Default to 'user' if no role found
    }));

    return NextResponse.json(transformedUsers);

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { full_name, email, password, role = 'user' } = await request.json();

    // Validate required fields
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (role && !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user"' },
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

    // Create user role in uroles table
    const { error: roleError } = await supabase
      .from('uroles')
      .insert({
        user_id: authData.user.id,
        role: role,
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      // Don't fail the request if role creation fails, but log it
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email,
        full_name,
        app_role: role,
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 