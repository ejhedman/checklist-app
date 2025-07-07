# Authentication Setup Guide

This application uses Supabase Auth for user authentication. Follow these steps to set up authentication:

## 1. Supabase Project Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project dashboard
3. Navigate to Settings > API
4. Copy your project URL and anon key

## 2. Environment Variables

Create a `.env.local` file in the `checklist-app` directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase project URL and anon key.

## 3. Database Schema

Run the SQL schema in your Supabase SQL editor:

```sql
-- Copy the contents of database/supabase_schema.sql
-- and run it in your Supabase SQL editor
```

**Important**: The schema includes Row Level Security (RLS) policies that allow authenticated users to:
- Insert, view, update, and delete users
- Manage teams and team memberships
- Access releases and features
- Manage their own release state

Make sure to run the complete schema to avoid permission errors.

## 4. Authentication Settings

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Set up email templates if needed
4. Configure any additional providers (Google, GitHub, etc.) if desired

## 5. Create Test Users

You can create test users through:

1. **Supabase Dashboard**: Go to Authentication > Users and create users manually
2. **Sign Up Flow**: Implement a sign-up component (not included in this basic setup)
3. **Direct Database**: Insert users directly into the `auth.users` table

## 6. Testing

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. You should see the login screen if not authenticated
4. Use your test user credentials to sign in

## Features Included

- ✅ Email/password authentication
- ✅ Protected routes
- ✅ User session management
- ✅ Sign out functionality
- ✅ Loading states
- ✅ Error handling

## Next Steps

Consider implementing:
- User registration/sign-up
- Password reset functionality
- Email verification
- Social authentication providers
- User profile management 