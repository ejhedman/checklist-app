-- Simple Sync Users to Auth.Users Table
-- This script uses a simpler approach to create auth users

-- Step 1: Show current sync status
SELECT 
    'Current sync status' as status,
    COUNT(*) as total_custom_users,
    COUNT(au.id) as users_with_auth,
    COUNT(*) - COUNT(au.id) as missing_auth_users
FROM users u
LEFT JOIN auth.users au ON u.id = au.id;

-- Step 2: Show users missing from auth.users
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.created_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL
ORDER BY u.created_at;

-- Step 3: Create auth users using a simpler approach
-- This approach creates auth users with minimal required fields
DO $$
DECLARE
    user_record RECORD;
    new_auth_id UUID;
BEGIN
    -- Loop through users that don't have auth.users entries
    FOR user_record IN 
        SELECT u.id, u.email, u.full_name, u.nickname, u.role, u.created_at
        FROM users u
        LEFT JOIN auth.users au ON u.id = au.id
        WHERE au.id IS NULL
    LOOP
        -- Generate a new UUID for auth user (we'll update the custom table later)
        new_auth_id := gen_random_uuid();
        
        -- Insert into auth.users with minimal required fields
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            app_metadata,
            user_metadata
        ) VALUES (
            new_auth_id,                                      -- id (new UUID)
            (SELECT id FROM auth.instances LIMIT 1),           -- instance_id
            'authenticated',                                   -- aud
            'authenticated',                                   -- role
            user_record.email,                                 -- email
            '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- encrypted_password (aaaaaa)
            NOW(),                                             -- email_confirmed_at
            COALESCE(user_record.created_at, NOW()),           -- created_at
            NOW(),                                             -- updated_at
            NOW(),                                             -- confirmed_at
            '{"provider":"email","providers":["email"]}',      -- raw_app_meta_data
            jsonb_build_object(                                -- raw_user_meta_data
                'full_name', user_record.full_name,
                'nickname', user_record.nickname
            ),
            jsonb_build_object(                                -- app_metadata
                'provider', 'email',
                'providers', ARRAY['email']
            ),
            jsonb_build_object(                                -- user_metadata
                'full_name', user_record.full_name,
                'nickname', user_record.nickname
            )
        );
        
        -- Update the custom users table to use the new auth user ID
        UPDATE users 
        SET id = new_auth_id 
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Created auth user for: % (old_id: %, new_id: %)', 
            user_record.email, user_record.id, new_auth_id;
    END LOOP;
    
    RAISE NOTICE 'Sync completed successfully';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error during sync: %', SQLERRM;
END $$;

-- Step 4: Verify sync results
SELECT 
    'Final sync verification' as check_type,
    COUNT(*) as total_custom_users,
    COUNT(au.id) as users_with_auth,
    COUNT(*) - COUNT(au.id) as still_missing
FROM users u
LEFT JOIN auth.users au ON u.id = au.id;

-- Step 5: Show final status of all users
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.created_at,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ Has auth user'
        ELSE '❌ Still missing auth user'
    END as auth_status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at;

-- Step 6: Test login capability
-- This query shows users that should be able to log in with email: aaaaaa
SELECT 
    'Login test info' as test_type,
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN encrypted_password IS NOT NULL THEN 1 END) as users_with_password
FROM auth.users; 