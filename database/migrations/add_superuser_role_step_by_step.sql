-- Add Superuser Role Migration (Step by Step)
-- Run these commands one at a time in your Supabase SQL editor

-- STEP 1: Show current enum values
SELECT 
    'Current enum values' as status,
    enumlabel
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_roles')
ORDER BY enumsortorder;

-- STEP 2: Add 'superuser' to the user_roles enum
-- Run ONLY this command first:
ALTER TYPE user_roles ADD VALUE 'superuser';

-- STEP 3: Verify the new enum value was added
-- Run this AFTER the ALTER TYPE command:
SELECT 
    'Updated enum values' as status,
    enumlabel
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_roles')
ORDER BY enumsortorder;

-- STEP 4: Show current users and their roles
-- Run this AFTER the enum is added:
SELECT 
    'Current users and roles' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
    COUNT(CASE WHEN role = 'release_manager' THEN 1 END) as release_manager_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'superuser' THEN 1 END) as superuser_count
FROM users;

-- STEP 5: Show detailed user roles
-- Run this AFTER the enum is added:
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM users
ORDER BY role, created_at; 