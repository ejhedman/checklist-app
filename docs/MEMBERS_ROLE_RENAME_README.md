# Members Role Field Rename Migration

This document outlines the complete migration to rename the `role` field to `member_role` in the `members` table.

## Overview

The `role` field in the `members` table has been renamed to `member_role` to avoid confusion with the `role` field in the `sys_roles` table (which was previously renamed to `sys_role`).

## Changes Made

### 1. Database Migrations

#### `database/rename_members_role_column.sql`
- Basic migration to rename the column
- Includes verification steps
- Creates backup of data

#### `database/update_members_role_function.sql`
- Updates the `create_member_from_auth_user` function
- Changes function to use `member_role` parameter and column

#### `database/rename_members_role_complete.sql`
- Complete migration combining column rename and function update
- Includes all verification steps
- Recommended migration to use

### 2. TypeScript Types

#### `checklist-app/src/types/database.ts`
- Updated `members` table interface
- Changed `role` to `member_role` in Row, Insert, and Update interfaces
- Maintains type safety with `'member' | 'release_manager' | 'admin'` union type

### 3. React Components

#### `checklist-app/src/components/members/MemberCard.tsx`
- Updated `Member` interface to use `member_role`
- Updated display logic to use `member.member_role`

#### `checklist-app/src/components/members/EditMemberDialog.tsx`
- Updated form data structure to use `member_role`
- Updated all form field references
- Updated database update operation

#### `checklist-app/src/components/members/AddMemberDialog.tsx`
- Updated form data structure to use `member_role`
- Updated all form field references
- Updated function call to use `member_role` parameter

#### `checklist-app/src/app/members/page.tsx`
- Updated `MemberWithTeams` interface
- Updated database query to select `member_role`
- Updated data transformation to use `member_role`

## Migration Steps

### 1. Run Database Migration

Execute the complete migration in your Supabase SQL editor:

```sql
-- Run the complete migration
-- File: database/rename_members_role_complete.sql
```

This migration will:
- Create a backup of the current data
- Rename the `role` column to `member_role`
- Update the constraint to use the new column name
- Update the `create_member_from_auth_user` function
- Verify all changes

### 2. Deploy Application Code

Deploy the updated application code that uses the new field name.

### 3. Verify Migration

The migration includes verification steps that will show:
- Updated table structure
- Data integrity check
- Function update confirmation

## Rollback Plan

If rollback is needed:

1. **Database Rollback**:
   ```sql
   -- Restore from backup
   DROP TABLE members;
   ALTER TABLE members_backup RENAME TO members;
   
   -- Recreate original function
   -- (Use the original function definition from members_redo_migration.sql)
   ```

2. **Code Rollback**:
   - Revert all TypeScript changes
   - Revert all component changes

## Testing

After migration:

1. **Test Member Creation**: Verify that new members can be created with the correct role
2. **Test Member Editing**: Verify that existing members can have their roles updated
3. **Test Member Display**: Verify that member roles are displayed correctly
4. **Test Database Function**: Verify that `create_member_from_auth_user` works correctly

## Notes

- The migration is designed to be safe and includes data backup
- All existing data will be preserved
- The application will continue to work with the same role values (`member`, `release_manager`, `admin`)
- No changes to business logic or role permissions are required

## Files Modified

### Database Files
- `database/rename_members_role_column.sql` (new)
- `database/update_members_role_function.sql` (new)
- `database/rename_members_role_complete.sql` (new)

### Application Files
- `checklist-app/src/types/database.ts`
- `checklist-app/src/components/members/MemberCard.tsx`
- `checklist-app/src/components/members/EditMemberDialog.tsx`
- `checklist-app/src/components/members/AddMemberDialog.tsx`
- `checklist-app/src/app/members/page.tsx`

### Documentation
- `MEMBERS_ROLE_RENAME_README.md` (this file) 