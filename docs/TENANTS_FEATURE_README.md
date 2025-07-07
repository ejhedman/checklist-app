# Tenants Feature

## Overview

The Tenants feature allows administrators to manage different organizational tenants within the system. Each tenant represents a separate organization or environment that can have its own set of data.

## Features

- **Tenant Management**: Create, edit, and delete tenants
- **Admin-Only Access**: Only users with `sys_role` of "admin" can access the Tenants feature
- **Data Isolation**: All data is associated with a specific tenant via `tenant_id` foreign key

## Database Schema

### Tenants Table
```sql
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Tenant ID Fields
The following tables now include a `tenant_id` field that references the tenants table:

- `activity_log`
- `features`
- `member_release_state`
- `members`
- `release_teams`
- `releases`
- `targets`
- `teams`
- `team_members`

## Migration

The migration file `database/add_tenants_migration.sql` includes:

1. Creation of the `tenants` table
2. Addition of `tenant_id` columns to all relevant tables
3. Population of existing data with the default "DWH" tenant
4. Creation of appropriate indexes for performance
5. RLS policies for admin-only access

## UI Components

### Pages
- `/tenants` - Main tenants management page

### Components
- `TenantCard` - Displays individual tenant information
- `AddTenantDialog` - Dialog for creating new tenants
- `EditTenantDialog` - Dialog for editing existing tenants

## Access Control

- **View**: All authenticated users can view tenants
- **Create/Edit/Delete**: Only users with `sys_role` of "admin"
- **Sidebar Access**: Tenants button only appears for admin users

## Default Tenant

The migration creates a default tenant named "DWH" and associates all existing data with this tenant.

## Usage

1. **Access**: Navigate to the Tenants page via the sidebar (admin users only)
2. **Create**: Click "New Tenant" to create a new tenant
3. **Edit**: Click the edit icon on any tenant card
4. **View**: All tenants are displayed in a card layout

## Future Enhancements

- Tenant-specific data filtering
- Tenant switching functionality
- Tenant-specific configurations
- Audit logging for tenant operations 