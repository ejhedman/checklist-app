-- Fix Duplicate Email Addresses in Users Table
-- Run this in your Supabase SQL editor to fix duplicate email issues

-- Step 1: Show all duplicate emails
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as user_ids,
    array_agg(full_name) as full_names
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY email;

-- Step 2: Show detailed information about duplicate users
WITH duplicate_emails AS (
    SELECT email
    FROM users 
    GROUP BY email 
    HAVING COUNT(*) > 1
)
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.created_at,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ Has auth user'
        ELSE '❌ No auth user'
    END as auth_status
FROM users u
JOIN duplicate_emails de ON u.email = de.email
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.email, u.created_at;

-- Step 3: Keep the most recent user for each email and mark others for deletion
WITH ranked_users AS (
    SELECT 
        id,
        email,
        full_name,
        role,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM users
)
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    CASE 
        WHEN rn = 1 THEN '✅ Keep (most recent)'
        ELSE '❌ Delete (duplicate)'
    END as action
FROM ranked_users
WHERE email IN (
    SELECT email 
    FROM users 
    GROUP BY email 
    HAVING COUNT(*) > 1
)
ORDER BY email, created_at DESC;

-- Step 4: Delete duplicate users (keep the most recent one)
-- WARNING: This will delete duplicate users. Run the above queries first to review.
-- Uncomment the following if you want to actually delete duplicates:

/*
DELETE FROM users 
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
        FROM users
    ) ranked
    WHERE rn > 1
);
*/

-- Step 5: Verify no more duplicates exist
SELECT 
    'After cleanup - Duplicate check' as check_type,
    COUNT(*) as duplicate_count
FROM (
    SELECT email
    FROM users 
    GROUP BY email 
    HAVING COUNT(*) > 1
) duplicates;

-- Step 6: Show final user count
SELECT 
    'Final user count' as status,
    COUNT(*) as total_users
FROM users; 