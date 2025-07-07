# Members Feature Redo

This document outlines the changes made to redo the members feature according to the new requirements.

## Database Changes

### Migration Script
Run the migration script `database/members_redo_migration.sql` in your Supabase SQL editor to:

1. **Rename `member_id` to `user_id`** in the members table
2. **Update member roles** from "user" to "member", "release_manager", "admin"
3. **Create helper functions** for auth user lookup and member creation
4. **Update foreign key constraints** to use the new column name
5. **Update RLS policies** for the new structure

### Key Changes
- `members.member_id` → `members.user_id` (references auth.users.id)
- Member roles: `member`, `release_manager`, `admin` (instead of `user`)
- New function: `get_auth_users_by_email()` for autocomplete
- New function: `create_member_from_auth_user()` for member creation

## Frontend Changes

### New Components
- **Command component** (`src/components/ui/command.tsx`) - for autocomplete functionality
- **Popover component** (`src/components/ui/popover.tsx`) - for dropdown UI
- **Auth users search API** (`src/app/api/auth-users/search/route.ts`) - for email search

### Updated Components

#### AddMemberDialog
- **Email autocomplete**: Users can search and select from existing auth users
- **Auto-fill full name**: When email is selected, full name is populated from auth user
- **Role selection**: Dropdown with member, release_manager, admin options
- **Nickname field**: Optional nickname for the member

#### EditMemberDialog
- **Read-only email and full name**: These come from auth users and cannot be changed
- **Editable nickname and role**: Only these fields can be modified
- **Role selection**: Dropdown with the new member roles

#### MemberCard
- **Role display**: Shows the member's role as a badge
- **Updated interface**: Includes role property

#### Members Page
- **Fetches from members table**: Instead of users table
- **Updated data structure**: Works with the new member roles

### TypeScript Types
Updated `src/types/database.ts` to reflect:
- `user_id` instead of `member_id`
- New member roles: `member`, `release_manager`, `admin`
- Required `user_id` in Insert operations

## How It Works

### Member Creation Flow
1. User clicks "Add Member"
2. User searches for an existing auth user by email
3. User selects an auth user from the dropdown
4. Full name is automatically populated from auth user data
5. User enters optional nickname and selects role
6. Member is created in the members table with `user_id` linking to auth user

### Member Management
- Members can be edited (nickname and role only)
- Members can be deleted
- Member roles are displayed as badges
- Team memberships are preserved

## Dependencies Added
- `cmdk` - For command palette/autocomplete functionality
- `@radix-ui/react-popover` - For dropdown UI components

## Testing
After running the migration:
1. Verify members are displayed correctly
2. Test adding a new member with email autocomplete
3. Test editing member nickname and role
4. Test deleting members
5. Verify team memberships still work

## Notes
- The migration preserves existing data
- Auth users must have confirmed emails to appear in search
- Member roles are separate from user roles (uroles table)
- The system now properly links members to auth users via `user_id` 