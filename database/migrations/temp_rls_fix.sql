-- Temporary RLS policy fix for user_release_state table
-- Run this in your Supabase SQL editor

-- Drop all existing policies
drop policy if exists "Users can manage own release state" on user_release_state;
drop policy if exists "Users can manage release state" on user_release_state;

-- Create a simple policy that allows all authenticated users to manage user_release_state
create policy "Allow all authenticated users to manage user_release_state" on user_release_state
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); 