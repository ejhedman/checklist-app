import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UsersRepository } from '@/lib/repository';

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

    // Search for auth users using repository
    const usersRepository = new UsersRepository();
    const filteredUsers = await usersRepository.searchAuthUsers(email || undefined, projectId);

    console.log('API Search - Final filtered users:', filteredUsers.length);
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