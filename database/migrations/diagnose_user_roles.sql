-- Diagnostic script for user_roles issues
-- Run this in Supabase SQL Editor to identify the problem

-- 1. Check if table exists
SELECT 'Table exists check' as check_type, 
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'user_roles'
       ) as result;

-- 2. Check table structure
SELECT 'Table structure' as check_type, 
       column_name, 
       data_type, 
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 'RLS status' as check_type,
       schemaname,
       tablename,
       rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_roles';

-- 4. Check RLS policies
SELECT 'RLS policies' as check_type,
       policyname,
       permissive,
       roles,
       cmd,
       qual
FROM pg_policies
WHERE tablename = 'user_roles';

-- 5. Check permissions
SELECT 'Permissions' as check_type,
       grantee,
       privilege_type,
       is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'user_roles';

-- 6. Check data count
SELECT 'Data count' as check_type,
       COUNT(*) as total_records
FROM user_roles;

-- 7. Check for your user specifically (replace with your user ID)
-- SELECT 'Your user role' as check_type,
--        user_id,
--        role,
--        created_at
-- FROM user_roles 
-- WHERE user_id = 'your-user-id-here';

-- 8. Test a simple query with auth context
SELECT 'Auth test' as check_type,
       auth.uid() as current_user_id,
       auth.role() as current_user_role;

-- 9. Test the actual query that's failing
SELECT 'Role query test' as check_type,
       ur.role,
       ur.user_id
FROM user_roles ur
WHERE ur.user_id = auth.uid(); 