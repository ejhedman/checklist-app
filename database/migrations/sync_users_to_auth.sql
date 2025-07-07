-- Sync Users from Custom Users Table to Auth.Users Table
-- This script will create auth users for any users that exist in the custom users table
-- but don't have corresponding auth.users entries

-- Step 1: Show users that exist in custom table but not in auth.users
SELECT 
    'Users missing from auth.users' as status,
    COUNT(*) as count
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL;

-- Step 2: Show detailed information about missing auth users
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.created_at,
    'Missing from auth.users' as status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL
ORDER BY u.created_at;

-- Step 3: Create auth users for missing entries
-- This will create auth users with the specified email, password, and metadata
DO $$
DECLARE
    user_record RECORD;
    auth_user_id UUID;
    encrypted_password TEXT;
BEGIN
    -- Loop through users that don't have auth.users entries
    FOR user_record IN 
        SELECT u.id, u.email, u.full_name, u.nickname, u.role
        FROM users u
        LEFT JOIN auth.users au ON u.id = au.id
        WHERE au.id IS NULL
    LOOP
        -- Generate encrypted password hash for 'aaaaaa'
        -- Note: This is a bcrypt hash for 'aaaaaa' with cost factor 10
        encrypted_password := '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
        
        -- Insert into auth.users
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
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmed_at,
            email_change_confirm_status,
            banned_until,
            reauthentication_sent_at,
            last_sign_in_at,
            app_metadata,
            user_metadata,
            factors,
            identities
        ) VALUES (
            user_record.id,                                    -- id
            (SELECT id FROM auth.instances LIMIT 1),           -- instance_id
            'authenticated',                                   -- aud
            'authenticated',                                   -- role
            user_record.email,                                 -- email
            encrypted_password,                                -- encrypted_password
            NOW(),                                             -- email_confirmed_at
            COALESCE(user_record.created_at, NOW()),           -- created_at
            NOW(),                                             -- updated_at
            '',                                                -- confirmation_token
            '',                                                -- email_change
            '',                                                -- email_change_token_new
            '',                                                -- recovery_token
            '{"provider":"email","providers":["email"]}',      -- raw_app_meta_data
            jsonb_build_object(                                -- raw_user_meta_data
                'full_name', user_record.full_name,
                'nickname', user_record.nickname
            ),
            false,                                             -- is_super_admin
            NOW(),                                             -- confirmed_at
            0,                                                 -- email_change_confirm_status
            NULL,                                              -- banned_until
            NULL,                                              -- reauthentication_sent_at
            NULL,                                              -- last_sign_in_at
            jsonb_build_object(                                -- app_metadata
                'provider', 'email',
                'providers', ARRAY['email']
            ),
            jsonb_build_object(                                -- user_metadata
                'full_name', user_record.full_name,
                'nickname', user_record.nickname
            ),
            '[]',                                              -- factors
            jsonb_build_array(                                 -- identities
                jsonb_build_object(
                    'id', gen_random_uuid(),
                    'user_id', user_record.id,
                    'identity_data', jsonb_build_object(
                        'sub', user_record.id,
                        'email', user_record.email
                    ),
                    'provider', 'email',
                    'last_sign_in_at', NOW(),
                    'created_at', NOW(),
                    'updated_at', NOW()
                )
            )
        );
        
        RAISE NOTICE 'Created auth user for: % (%)', user_record.email, user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Sync completed successfully';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error during sync: %', SQLERRM;
END $$;

-- Step 4: Verify sync results
SELECT 
    'Sync verification' as check_type,
    COUNT(*) as total_custom_users,
    COUNT(au.id) as users_with_auth,
    COUNT(*) - COUNT(au.id) as still_missing
FROM users u
LEFT JOIN auth.users au ON u.id = au.id;

-- Step 5: Show any remaining users without auth entries
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

-- Step 6: Show summary of auth users created
SELECT 
    'Auth users summary' as summary_type,
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as active_users
FROM auth.users; 