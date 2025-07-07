-- Add Superuser Role Migration
-- This script adds 'superuser' to the user_roles enum type

-- Step 1: Show current enum values
SELECT 
    'Current enum values' as status,
    enumlabel
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_roles')
ORDER BY enumsortorder;

-- Step 2: Add 'superuser' to the user_roles enum
-- Note: PostgreSQL doesn't allow adding values to the middle of an enum,
-- so we add it at the end
ALTER TYPE user_roles ADD VALUE 'superuser';

-- Step 3: Verify the new enum value was added
SELECT 
    'Updated enum values' as status,
    enumlabel
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_roles')
ORDER BY enumsortorder;

-- Step 4: Show current users and their roles
SELECT 
    'Current users and roles' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
    COUNT(CASE WHEN role = 'release_manager' THEN 1 END) as release_manager_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'superuser' THEN 1 END) as superuser_count
FROM users;

-- Step 5: Show detailed user roles
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM users
ORDER BY role, created_at;

-- Step 6: Optional: Update any existing admin users to superuser if needed
-- Uncomment the following if you want to promote existing admins to superusers:
/*
UPDATE users 
SET role = 'superuser' 
WHERE role = 'admin' 
AND email IN ('your-superuser-email@example.com');
*/ 