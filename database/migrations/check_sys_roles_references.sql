-- Check for references to sys_roles.role column
-- Run this before and after the migration to find what needs to be updated

-- Check for foreign key constraints that reference sys_roles.role
SELECT 
  'Foreign Key References' as info,
  kcu.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'sys_roles'
  AND ccu.column_name = 'role';

-- Check for indexes on sys_roles.role
SELECT 
  'Indexes on sys_roles.role' as info,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'sys_roles' 
  AND indexdef LIKE '%role%';

-- Check for RLS policies that reference sys_roles.role
SELECT 
  'RLS Policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE qual LIKE '%sys_roles%role%' 
   OR with_check LIKE '%sys_roles%role%';

-- Check for functions that reference sys_roles.role
SELECT 
  'Functions referencing sys_roles.role' as info,
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE prosrc LIKE '%sys_roles%role%';

-- Check for views that reference sys_roles.role
SELECT 
  'Views referencing sys_roles.role' as info,
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition LIKE '%sys_roles%role%';

-- Check for triggers that reference sys_roles.role
SELECT 
  'Triggers referencing sys_roles.role' as info,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgfoid IN (
  SELECT oid FROM pg_proc WHERE prosrc LIKE '%sys_roles%role%'
); 