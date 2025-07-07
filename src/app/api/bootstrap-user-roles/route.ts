import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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

    if (!authUsers.users || authUsers.users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found to bootstrap',
        usersProcessed: 0
      });
    }

    // Fetch existing user roles to avoid duplicates
    const { data: existingRoles, error: rolesError } = await supabase
      .from('uroles')
      .select('user_id');

    if (rolesError) {
      console.error('Error fetching existing roles:', rolesError);
      return NextResponse.json(
        { error: rolesError.message },
        { status: 500 }
      );
    }

    // Create a set of user IDs that already have roles
    const existingUserIds = new Set(existingRoles?.map(role => role.user_id) || []);

    // Filter out users that already have roles
    const usersNeedingRoles = authUsers.users.filter(user => !existingUserIds.has(user.id));

    if (usersNeedingRoles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All users already have roles assigned',
        usersProcessed: 0
      });
    }

    // Prepare role records for users that don't have them
    const roleRecords = usersNeedingRoles.map(user => ({
      user_id: user.id,
      role: 'user' // Default role
    }));

    // Insert the role records
    const { error: insertError } = await supabase
      .from('uroles')
      .insert(roleRecords);

    if (insertError) {
      console.error('Error inserting user roles:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned 'user' role to ${usersNeedingRoles.length} users`,
      usersProcessed: usersNeedingRoles.length,
      totalUsers: authUsers.users.length,
      usersWithRoles: existingUserIds.size + usersNeedingRoles.length
    });

  } catch (error) {
    console.error('Error bootstrapping user roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Fetch existing user roles
    const { data: existingRoles, error: rolesError } = await supabase
      .from('uroles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching existing roles:', rolesError);
      return NextResponse.json(
        { error: rolesError.message },
        { status: 500 }
      );
    }

    // Create a map of user roles
    const roleMap = new Map();
    existingRoles?.forEach(role => {
      roleMap.set(role.user_id, role.role);
    });

    // Count users with and without roles
    const usersWithRoles = existingRoles?.length || 0;
    const usersWithoutRoles = authUsers.users.length - usersWithRoles;

    return NextResponse.json({
      totalUsers: authUsers.users.length,
      usersWithRoles,
      usersWithoutRoles,
      usersNeedingBootstrap: usersWithoutRoles,
      canBootstrap: usersWithoutRoles > 0
    });

  } catch (error) {
    console.error('Error checking user roles status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 