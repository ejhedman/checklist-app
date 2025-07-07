-- Check Current Members Table State
-- Run this in your Supabase SQL editor to see the current state

-- Check if members table exists
SELECT 
  'Table Check' as info,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'members'
  ) as members_table_exists;

-- Check table structure
SELECT 
  'Table Structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'members'
ORDER BY ordinal_position;

-- Check current roles in the members table
SELECT 
  'Current roles in members table' as info,
  role,
  COUNT(*) as count
FROM members 
GROUP BY role 
ORDER BY role;

-- Check for any constraint violations
SELECT 
  'Constraint Check' as info,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name = 'members'
  AND constraint_type = 'CHECK';

-- Show sample data
SELECT 
  'Sample Members Data' as info,
  id,
  member_id,
  email,
  full_name,
  role,
  created_at
FROM members
LIMIT 5;

-- Check if there are any foreign key references
SELECT 
  'Foreign Key References' as info,
  kcu.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (ccu.table_name = 'members' OR kcu.column_name LIKE '%member_id%'); 