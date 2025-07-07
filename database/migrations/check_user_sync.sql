-- Check User Synchronization Between Custom Users Table and Auth Users Table
-- Run this in your Supabase SQL editor to diagnose user sync issues

-- Check users in custom users table
SELECT 
    'Custom Users Table' as source,
    COUNT(*) as user_count
FROM users;

-- Check users in auth.users table
SELECT 
    'Auth Users Table' as source,
    COUNT(*) as user_count
FROM auth.users;

-- Find users that exist in custom table but not in auth.users
SELECT 
    u.id,
    u.email,
    u.full_name,
    'Missing in auth.users' as issue
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL;

-- Find users that exist in auth.users but not in custom table
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    'Missing in custom users table' as issue
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- Show all users with their sync status
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