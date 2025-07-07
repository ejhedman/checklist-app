# User Roles Table Setup Guide

This guide will help you set up the `user_roles` table in your Supabase database to manage app-specific roles for users.

## Prerequisites

- Access to your Supabase dashboard
- Admin privileges in your Supabase project

## Option 1: Complete Setup (Recommended)

For a complete setup that creates the table and bootstraps existing users:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the complete setup script: `database/complete_user_roles_setup.sql`

This script will:
- Create the `user_roles` table
- Set up indexes, triggers, and RLS policies
- Bootstrap all existing users with the 'user' role
- Create helper functions
- Provide verification and summary

## Option 2: Step-by-Step Setup

If you prefer to run the setup in steps:

### Step 1: Create the User Roles Table

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL script:

```sql
-- Create User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique, -- References Supabase auth.users.id
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Create trigger for updated_at (if set_updated_at function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE TRIGGER set_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view user roles" ON user_roles;
CREATE POLICY "Users can view user roles" ON user_roles
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage user roles" ON user_roles;
CREATE POLICY "Users can manage user roles" ON user_roles
FOR ALL USING (auth.role() = 'authenticated');
```

### Step 2: Bootstrap Existing Users

After creating the table, bootstrap existing users with the default 'user' role:

```sql
-- Bootstrap user_roles with existing auth users
INSERT INTO user_roles (user_id, role)
SELECT 
  au.id as user_id,
  'user' as role
FROM auth.users au
WHERE au.id NOT IN (
  -- Exclude users that already have a role assigned
  SELECT ur.user_id 
  FROM user_roles ur
)
ON CONFLICT (user_id) DO NOTHING;
```

Or run the bootstrap script: `database/bootstrap_user_roles.sql`

### Step 3: Create Helper Functions (Optional)

You can also create helper functions for easier role management:

```sql
-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM user_roles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user role
CREATE OR REPLACE FUNCTION set_user_role(user_uuid uuid, new_role text)
RETURNS void AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (user_uuid, new_role)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 4: Verify the Setup

Run this query to verify the table was created correctly:

```sql
-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
ORDER BY ordinal_position;

-- Check if any user roles exist
SELECT COUNT(*) as total_user_roles FROM user_roles;

-- Verify all users have roles
SELECT 
  'Verification' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM user_roles) 
    THEN 'PASS: All users have roles'
    ELSE 'FAIL: Some users missing roles'
  END as result;
```

## Step 5: Test the Application

After running the migration:

1. Start your development server: `npm run dev`
2. Navigate to the Users page
3. Try creating a new user with a role
4. Try editing an existing user's role
5. Verify that roles are displayed correctly in the user cards

## Troubleshooting

### Common Issues

1. **"relation 'user_roles' does not exist"**
   - Make sure you ran the CREATE TABLE script in the Supabase SQL Editor
   - Check that you're connected to the correct database

2. **Permission denied errors**
   - Ensure RLS policies are set up correctly
   - Check that your service role key has the necessary permissions

3. **Role not showing in the UI**
   - Verify that the TypeScript types are updated
   - Check that the API endpoints are fetching user roles correctly

4. **Existing users don't have roles**
   - Run the bootstrap script to assign roles to existing users
   - Check that the bootstrap script completed successfully

### Manual Role Assignment

If you need to manually assign roles to specific users:

```sql
-- Assign admin role to a specific user (replace with actual user_id)
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin';

-- Assign user role to a specific user (replace with actual user_id)
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'user')
ON CONFLICT (user_id)
DO UPDATE SET role = 'user';
```

### Check for Users Without Roles

To find users that don't have roles assigned:

```sql
-- Find auth users without roles
SELECT 
  au.id,
  au.email,
  au.user_metadata->>'full_name' as full_name
FROM auth.users au
WHERE au.id NOT IN (
  SELECT ur.user_id 
  FROM user_roles ur
);
```

## Next Steps

Once the table is set up:

1. The application will automatically create user roles when new users are created
2. Existing users will have the 'user' role by default
3. You can manage roles through the user management interface
4. Consider implementing role-based access control in your application logic

## Rollback

If you need to remove the user_roles table:

```sql
-- Drop the table (WARNING: This will delete all user role data)
DROP TABLE IF EXISTS user_roles CASCADE;

-- Drop the helper functions
DROP FUNCTION IF EXISTS get_user_role(uuid);
DROP FUNCTION IF EXISTS set_user_role(uuid, text);
```

## Available Scripts

- `database/complete_user_roles_setup.sql` - Complete setup and bootstrap
- `database/bootstrap_user_roles.sql` - Bootstrap existing users only
- `database/create_user_roles_table.sql` - Create table only 