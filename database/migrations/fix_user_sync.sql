-- Fix User Synchronization Issues
-- Run this in your Supabase SQL editor to fix user sync problems

-- Step 1: Create missing users in custom table for auth.users entries
INSERT INTO users (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    'user' as role,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update existing users with missing information
UPDATE users u
SET 
    email = COALESCE(u.email, au.email),
    full_name = COALESCE(u.full_name, au.raw_user_meta_data->>'full_name', au.email),
    updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
AND (u.email IS NULL OR u.full_name IS NULL);

-- Step 3: Show the results after fixing
SELECT 
    'After Fix - Custom Users Table' as source,
    COUNT(*) as user_count
FROM users;

SELECT 
    'After Fix - Auth Users Table' as source,
    COUNT(*) as user_count
FROM auth.users;

-- Step 4: Show sync status after fixing
SELECT 
    u.id,
    u.email,
    u.full_name,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ Synced'
        ELSE '❌ Missing in auth.users'
    END as auth_status,
    CASE 
        WHEN u.id IS NOT NULL THEN '✅ Synced'
        ELSE '❌ Missing in custom table'
    END as custom_status
FROM users u
FULL OUTER JOIN auth.users au ON u.id = au.id
ORDER BY u.email; 