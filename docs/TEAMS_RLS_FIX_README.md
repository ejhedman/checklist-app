# Teams RLS Policy Fix

## Issue Description

The CreateReleaseDialog component shows "No teams available. Create teams first to assign them to releases" even when teams exist in the database. This is happening because the database has been migrated from a `users`-based system to a `members`-based system, but the Row Level Security (RLS) policies for the `teams` table are still using the old user-based policies.

## Root Cause

1. **Database Migration**: The database was migrated from `users` → `members` and `team_users` → `team_members`
2. **RLS Policy Mismatch**: The `teams` table RLS policies still reference `"Users can view all teams"` instead of `"Members can view all teams"`
3. **Authentication Context**: The RLS policies are checking for `auth.role() = 'authenticated'` but the policies were created with the old naming convention

## Solution

### Step 1: Check Current State
Run the diagnostic script to see the current state:
```sql
-- Run: database/check_teams_data.sql
```

### Step 2: Fix RLS Policies
Apply the correct RLS policies for the teams table:
```sql
-- Run: database/fix_teams_rls_policies.sql
```

### Step 3: Verify the Fix
Check that the policies are correctly applied:
```sql
-- Run: database/check_teams_data.sql (again)
```

## Alternative Testing Approach

If you want to test if RLS is the issue:

### Temporarily Disable RLS (for testing only)
```sql
-- Run: database/temp_disable_teams_rls.sql
```

### Re-enable RLS with Correct Policies
```sql
-- Run: database/re_enable_teams_rls.sql
```

## Files Modified

1. **`checklist-app/src/components/releases/CreateReleaseDialog.tsx`**
   - Added debugging and error handling for teams fetching
   - Added comprehensive logging to diagnose the issue

2. **`checklist-app/src/app/teams/page.tsx`**
   - Added fallback logic for when complex queries fail
   - Added debugging to compare simple vs complex queries

3. **Database Scripts Created:**
   - `database/fix_teams_rls_policies.sql` - Fix RLS policies
   - `database/check_teams_data.sql` - Diagnostic script
   - `database/temp_disable_teams_rls.sql` - Temporary disable for testing
   - `database/re_enable_teams_rls.sql` - Re-enable with correct policies

## Expected Behavior After Fix

1. **CreateReleaseDialog**: Should show available teams in the checkbox list
2. **Teams Page**: Should continue to work as before
3. **Console Logs**: Should show successful teams fetching without errors

## Testing

1. Open the browser console
2. Navigate to a release detail page
3. Click the edit button
4. Check the console for teams fetching logs
5. Verify that teams appear in the dialog

## Security Note

The fix maintains the same security level - only authenticated users can access teams. The change is purely in the policy naming and structure to match the new members-based system. 