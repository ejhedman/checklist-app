-- Add Unique Constraint on Email Column
-- Run this AFTER fixing existing duplicates

-- Step 1: Check if unique constraint already exists
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_name = 'users' 
    AND kcu.column_name = 'email';

-- Step 2: Add unique constraint (only if it doesn't exist)
-- This will fail if there are still duplicate emails
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_email_key' 
        AND table_name = 'users'
    ) THEN
        -- Add unique constraint
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        RAISE NOTICE 'Unique constraint added to email column';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on email column';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Unique constraint already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- Step 3: Verify the constraint was added
SELECT 
    'Constraint verification' as check_type,
    COUNT(*) as constraint_count
FROM information_schema.table_constraints 
WHERE constraint_name = 'users_email_key' 
    AND table_name = 'users';

-- Step 4: Test the constraint by trying to insert a duplicate (should fail)
-- Uncomment the following to test (it will fail as expected):
/*
INSERT INTO users (id, email, full_name, role) 
VALUES (gen_random_uuid(), 'test@example.com', 'Test User', 'user');
*/ 