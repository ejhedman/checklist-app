# User Management Setup Guide

This guide explains how to set up the user management feature for the checklist application.

## Prerequisites

1. Supabase project with authentication enabled
2. Database schema with user roles (see database migration below)
3. Service role key for admin operations

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Required for user management API routes (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Getting the Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (not the anon key)
4. Add it to your `.env.local` file

**Important**: The service role key has admin privileges and should never be exposed to the client-side.

## Database Setup

### 1. Run the User Roles Migration

Execute the following SQL in your Supabase SQL editor:

```sql
-- Create user_roles enum type
CREATE TYPE user_roles AS ENUM ('user', 'release_manager', 'admin');

-- Add role column to users table
ALTER TABLE users ADD COLUMN role user_roles NOT NULL DEFAULT 'user';

-- Update RLS policies to consider roles
-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow release managers to view all users but only edit their own profile
CREATE POLICY "Release managers can view all users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'release_manager')
  )
);

-- Add comment to document the role system
COMMENT ON COLUMN users.role IS 'User role: user (basic access), release_manager (can manage releases), admin (full access)';
```

Or run the migration file: `database/user_roles_migration.sql`

### 2. Update Existing Users

If you have existing users, you may want to assign them appropriate roles:

```sql
-- Example: Make the first user an admin
UPDATE users SET role = 'admin' WHERE id = 'your-user-id';

-- Example: Make all existing users have 'user' role (default)
UPDATE users SET role = 'user' WHERE role IS NULL;
```

## User Roles

The application supports three user roles:

1. **User** (`user`): Basic access to view and manage their own data
2. **Release Manager** (`release_manager`): Can manage releases and view all users
3. **Admin** (`admin`): Full access to manage all users and system settings

## Features

### User Management Page

- **Location**: `/users` (accessible via sidebar)
- **Features**:
  - View all users with their roles
  - Create new users with email/password
  - Edit user information and roles
  - Delete users (removes from both auth and database)

### API Endpoints

- `POST /api/users` - Create a new user
- `DELETE /api/users/[id]` - Delete a user
- `PUT /api/users/[id]` - Update user information (future enhancement)

## Security Considerations

1. **Service Role Key**: Keep this secure and never expose it to the client
2. **Role-Based Access**: Only admins can manage users
3. **Password Requirements**: Minimum 6 characters (configurable)
4. **Email Confirmation**: Users are auto-confirmed for simplicity

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `/users`
3. Try creating a new user with different roles
4. Test editing and deleting users

## Troubleshooting

### Common Issues

1. **"Service role key not found"**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in your environment
2. **"Permission denied"**: Check that your user has admin role
3. **"User creation failed"**: Verify the database schema is updated with the role column

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
DEBUG=true
```

This will log API requests and responses for troubleshooting. 