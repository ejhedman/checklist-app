-- Test Role Fetching After Fixes
-- Run this script to verify the role system is working correctly

-- STEP 1: Test the helper function
SELECT 
  'Helper Function Test' as test_name,
  get_user_role() as current_user_role;

-- STEP 2: Test with a specific user (replace with actual user ID)
-- Uncomment and modify the following if you know the user ID:
/*
SELECT 
  'Specific User Test' as test_name,
  get_user_role('your-user-id-here') as user_role;
*/

-- STEP 3: Test the exact query that the app uses
SELECT 
  'App Query Test' as test_name,
  ur.role,
  ur.user_id,
  au.email
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE ur.user_id = auth.uid();

-- STEP 4: Test RLS policies by checking if we can read our own role
SELECT 
  'RLS Policy Test' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS: Can read own role'
    ELSE 'FAIL: Cannot read own role'
  END as result
FROM user_roles 
WHERE user_id = auth.uid();

-- STEP 5: Test that we cannot read other users' roles (RLS restriction)
SELECT 
  'RLS Restriction Test' as test_name,
  CASE 
    WHEN COUNT(*) = 1 THEN 'PASS: Can only read own role'
    ELSE 'FAIL: Can read other users roles'
  END as result
FROM user_roles;

-- STEP 6: Test ehedman@acm.org specifically (if you're logged in as that user)
SELECT 
  'ehedman@acm.org Test' as test_name,
  CASE 
    WHEN ur.role = 'admin' THEN 'PASS: Has admin role'
    WHEN ur.role = 'user' THEN 'FAIL: Has user role (should be admin)'
    WHEN ur.role IS NULL THEN 'FAIL: No role assigned'
    ELSE 'UNKNOWN: Unexpected role'
  END as result,
  ur.role,
  ur.user_id
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE ur.user_id = auth.uid() AND au.email = 'ehedman@acm.org';

-- STEP 7: Performance test - measure query time
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    duration interval;
BEGIN
    start_time := clock_timestamp();
    
    -- Run the role query multiple times to test performance
    FOR i IN 1..10 LOOP
        PERFORM get_user_role();
    END LOOP;
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    RAISE NOTICE 'Performance Test: 10 role queries took %', duration;
END $$;

-- STEP 8: Test error handling by trying to get role for non-existent user
SELECT 
  'Error Handling Test' as test_name,
  CASE 
    WHEN get_user_role('00000000-0000-0000-0000-000000000000') IS NULL THEN 'PASS: Returns NULL for non-existent user'
    ELSE 'FAIL: Returns unexpected result for non-existent user'
  END as result;

-- STEP 9: Summary of all tests
SELECT 
  'Test Summary' as summary,
  (SELECT COUNT(*) FROM user_roles WHERE user_id = auth.uid()) as user_has_role,
  (SELECT role FROM user_roles WHERE user_id = auth.uid()) as user_role,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as user_email,
  auth.uid() as current_user_id; 