# Database Fix Instructions

## Step 1: Run the Fix Script

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `database/fix_user_roles_final.sql`
4. Click "Run" to execute the script

## Step 2: Verify the Fix

After running the fix script, run this test query in the SQL Editor:

```sql
-- Test if the table exists and has data
SELECT 'user_roles table test' as test_name, COUNT(*) as record_count FROM user_roles;

-- Check your specific user role (replace with your actual user ID)
SELECT * FROM user_roles WHERE user_id = 'your-user-id-here';
```

## Step 3: Set Admin Role (Optional)

If you want to make yourself an admin, run:

```sql
UPDATE user_roles SET role = 'admin' WHERE user_id = 'your-user-id-here';
```

## Step 4: Test the App

1. Refresh your app in the browser
2. Check the console for any errors
3. The User Management icon should now appear in the sidebar if you have admin role

## Troubleshooting

If you still see timeouts:

1. Check if the user_roles table exists:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'user_roles'
   );
   ```

2. Check RLS policies:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'user_roles';
   ```

3. Check if your user has a role record:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'your-user-id-here';
   ``` 