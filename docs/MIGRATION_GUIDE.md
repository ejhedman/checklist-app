# Migration Guide: Users Table to Members Table

This guide will help you migrate from the `users` table to the `members` table, adding a `member_id` field and updating all references throughout the application.

## Overview

The migration involves:
1. Renaming the `users` table to `members`
2. Adding a `member_id` field (GUID) to the members table
3. Updating all foreign key references from `user_id` to `member_id`
4. Updating all RLS policies and triggers
5. Updating TypeScript types
6. Updating all code references

## Prerequisites

- Backup your database before running the migration
- Ensure you have access to your Supabase SQL editor
- Have your development environment ready for code updates

## Step 1: Database Migration

### 1.1 Run the SQL Migration Script

Execute the migration script in your Supabase SQL editor:

```sql
-- Run the complete migration script from: database/rename_users_to_members_migration.sql
```

This script will:
- Create the new `members` table with `member_id` field
- Copy all data from `users` to `members`
- Create new foreign key tables (`team_members`, `member_release_state`)
- Update existing tables to use `member_id` references
- Set up RLS policies and triggers
- Clean up old tables and columns

### 1.2 Verify the Migration

After running the migration, verify that:
- All data was copied correctly
- Foreign key relationships are intact
- RLS policies are working
- No data loss occurred

## Step 2: Update TypeScript Types

The TypeScript types have been updated in `checklist-app/src/types/database.ts` to reflect:
- New `members` table structure
- `member_id` field
- Updated foreign key references
- New table names (`team_members`, `member_release_state`)

## Step 3: Update API Routes

New API routes have been created:
- `checklist-app/src/app/api/members/route.ts` (replaces `/api/users`)
- `checklist-app/src/app/api/members/[id]/route.ts` (replaces `/api/users/[id]`)
- `checklist-app/src/app/api/members/[id]/password/route.ts` (replaces `/api/users/[id]/password`)

## Step 4: Update Code References

### 4.1 Run the Automated Update Script

Execute the update script to automatically update most code references:

```bash
chmod +x update_code_references.sh
./update_code_references.sh
```

### 4.2 Manual Updates Required

After running the automated script, you'll need to manually update:

#### 4.2.1 Component Imports and References

Update these files to use the new table names and field names:

**Files to update:**
- `checklist-app/src/app/members/page.tsx`
- `checklist-app/src/components/members/MemberCard.tsx`
- `checklist-app/src/components/members/AddMemberDialog.tsx`
- `checklist-app/src/components/members/EditMemberDialog.tsx`
- `checklist-app/src/components/teams/EditTeamDialog.tsx`
- `checklist-app/src/components/releases/ReleaseDetailCard.tsx`
- `checklist-app/src/components/releases/CreateReleaseDialog.tsx`
- `checklist-app/src/components/releases/AddFeatureDialog.tsx`
- `checklist-app/src/app/releases/page.tsx`
- `checklist-app/src/app/releases/[name]/page.tsx`
- `checklist-app/src/app/calendar/page.tsx`

#### 4.2.2 Key Changes to Make

1. **Table References:**
   ```typescript
   // Old
   .from("users")
   
   // New
   .from("members")
   ```

2. **Field References:**
   ```typescript
   // Old
   user_id: userId,
   dri_user_id: formData.driUserId,
   
   // New
   member_id: memberId,
   dri_member_id: formData.driMemberId,
   ```

3. **Join References:**
   ```typescript
   // Old
   team_users (
     teams (name)
   )
   
   // New
   team_members (
     teams (name)
   )
   ```

4. **API Endpoints:**
   ```typescript
   // Old
   fetch('/api/users')
   fetch(`/api/users/${id}`)
   
   // New
   fetch('/api/members')
   fetch(`/api/members/${id}`)
   ```

## Step 5: Update Navigation and Routes

### 5.1 Update Sidebar Navigation

Update the sidebar to point to the new members page:

```typescript
// In Sidebar.tsx or similar navigation component
{
  name: 'Members',
  href: '/members',
  icon: Users,
}
```

### 5.2 Update Page Routes

Ensure all links point to `/members` instead of `/users`.

## Step 6: Testing

### 6.1 Database Testing

1. Verify all data is accessible
2. Test CRUD operations on members
3. Test team memberships
4. Test release state management
5. Test feature DRI assignments

### 6.2 Application Testing

1. Test member creation
2. Test member editing
3. Test member deletion
4. Test team management
5. Test release management
6. Test feature management
7. Test calendar functionality

## Step 7: Cleanup

### 7.1 Remove Old Files

After confirming everything works, remove old files:

```bash
# Remove old API routes
rm -rf checklist-app/src/app/api/users

# Remove old user components (if replaced)
rm -rf checklist-app/src/components/users
```

### 7.2 Update Documentation

Update any documentation that references the old table structure.

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Errors:**
   - Ensure all data was properly migrated
   - Check that member_id values are correctly set

2. **RLS Policy Issues:**
   - Verify RLS policies are correctly updated
   - Check that auth.uid() references are working

3. **TypeScript Errors:**
   - Ensure database types are regenerated
   - Check that all imports are updated

4. **API Route Errors:**
   - Verify new API routes are in place
   - Check that endpoints are correctly updated

### Rollback Plan

If issues arise, you can rollback by:
1. Restoring the database backup
2. Reverting code changes
3. Removing new API routes
4. Restoring old TypeScript types

## Verification Checklist

- [ ] Database migration completed successfully
- [ ] All data migrated without loss
- [ ] TypeScript types updated
- [ ] API routes updated
- [ ] Component references updated
- [ ] Navigation updated
- [ ] All functionality tested
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Old files cleaned up

## Notes

- The `member_id` field is a GUID that provides a clear distinction from Supabase auth users
- All foreign key relationships now use `member_id` instead of `user_id`
- RLS policies have been updated to work with the new structure
- The migration maintains backward compatibility where possible
- All existing functionality should work with the new structure 