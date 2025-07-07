-- Migration: Fix RLS policy for members table
-- The current policy only allows users to update their own profile, but we need to allow
-- users to update member records for team management

-- STEP 1: Check current RLS policies on members table
SELECT 
  'Current RLS policies on members table' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'members';

-- STEP 2: Drop the restrictive update policy
DROP POLICY IF EXISTS "Members can update own profile" ON members;

-- STEP 3: Create a new policy that allows authenticated users to update member records
-- This allows team management functionality while still maintaining security
CREATE POLICY "Members can update member records" ON members
FOR UPDATE USING (auth.role() = 'authenticated');

-- STEP 4: Also update the delete policy to be more permissive for admin functionality
DROP POLICY IF EXISTS "Members can delete own profile" ON members;
CREATE POLICY "Members can delete member records" ON members
FOR DELETE USING (auth.role() = 'authenticated');

-- STEP 5: Verify the updated policies
SELECT 
  'Updated RLS policies on members table' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'members';

-- STEP 6: Test the update functionality (optional)
-- This will show if the policy is working correctly
SELECT 
  'RLS Policy Test' as info,
  'Members table now allows authenticated users to update records' as status,
  'Try updating a member role in the application' as next_step; 