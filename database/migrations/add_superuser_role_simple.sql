-- Add Superuser Role Migration (Simple)
-- Run this script in your Supabase SQL editor

-- Step 1: Show current enum values
SELECT 
    'Current enum values' as status,
    enumlabel
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_roles')
ORDER BY enumsortorder;

-- Step 2: Add 'superuser' to the user_roles enum
-- Run this command separately
ALTER TYPE user_roles ADD VALUE 'superuser';

-- Step 3: Verify the new enum value was added
-- Run this after the ALTER TYPE command
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