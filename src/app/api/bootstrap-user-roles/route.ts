import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UsersRepository } from '@/lib/repository';

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

    // Use repository to bootstrap user roles
    const usersRepository = new UsersRepository();
    const result = await usersRepository.bootstrapUserRoles(authUsers.users);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned 'user' role to ${result.usersProcessed} users`,
      usersProcessed: result.usersProcessed,
      totalUsers: authUsers.users.length,
      usersWithRoles: result.usersWithRoles
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

    // Use repository to get user roles status
    const usersRepository = new UsersRepository();
    const status = await usersRepository.getUserRolesStatus();

    return NextResponse.json({
      totalUsers: authUsers.users.length,
      usersWithRoles: status.usersWithRoles,
      usersWithoutRoles: status.usersWithoutRoles,
      usersNeedingBootstrap: status.usersWithoutRoles,
      canBootstrap: status.usersWithoutRoles > 0
    });

  } catch (error) {
    console.error('Error checking user roles status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 