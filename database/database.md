# Database Documentation - Release Management Checklist App

## Table of Contents

1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Multi-Tenancy Design](#multi-tenancy-design)
4. [Table Definitions](#table-definitions)
5. [Relationships & Constraints](#relationships--constraints)
6. [Row-Level Security (RLS)](#row-level-security-rls)
7. [Functions & Triggers](#functions--triggers)
8. [Data Types & Validation](#data-types--validation)
9. [Audit Trail](#audit-trail)
10. [Migration Strategy](#migration-strategy)
11. [Database Conventions](#database-conventions)

---

## Overview

### Database Technology
- **Platform**: Supabase (PostgreSQL 17.4)
- **Location**: Cloud-hosted with automatic backups
- **Connection**: SSL/TLS encrypted connections
- **Authentication**: Supabase Auth integration with Row-Level Security (RLS)

### Design Principles
- **Multi-Tenancy**: Complete tenant isolation with RLS policies
- **Normalization**: Third Normal Form (3NF) compliance
- **Security**: Row-Level Security (RLS) on all tables
- **Audit Trail**: Comprehensive activity logging
- **Performance**: Optimized indexes for common queries
- **Scalability**: Designed for 10,000+ users across multiple tenants

### Schema Version
- **Current Version**: 2.0.0
- **Last Updated**: January 2025
- **Migration Scripts**: Available in `/database/migrations/` directory

---

## Database Architecture

### High-Level Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    tenants      │    │    targets      │    │     teams       │
│                 │    │                 │    │                 │
│ • id (PK)       │    │ • id (PK)       │    │ • id (PK)       │
│ • name          │    │ • short_name    │    │ • name          │
│ • created_at    │    │ • name          │    │ • description   │
│ • updated_at    │    │ • is_live       │    │ • tenant_id (FK)│
└─────────────────┘    │ • tenant_id (FK)│    │ • created_at    │
         │             │ • created_at    │    │ • updated_at    │
         │             │ • updated_at    │    └─────────────────┘
         │             └─────────────────┘             │
         │                                              │
         │                                    ┌─────────────────┐
         │                                    │  team_members   │
         │                                    │                 │
         │                                    │ • team_id (FK)  │
         │                                    │ • member_id (FK)│
         │                                    │ • tenant_id (FK)│
         │                                    │ • created_at    │
         │                                    │ • updated_at    │
         │                                    └─────────────────┘
         │
         │             ┌─────────────────┐
         │             │    members      │
         │             │                 │
         │             │ • id (PK)       │
         │             │ • user_id       │
         │             │ • email         │
         │             │ • full_name     │
         │             │ • nickname      │
         │             │ • member_role   │
         │             │ • tenant_id (FK)│
         │             │ • created_at    │
         │             │ • updated_at    │
         │             └─────────────────┘
         │                      │
         │                      │
         │             ┌─────────────────┐
         │             │   sys_roles     │
         │             │                 │
         │             │ • id (PK)       │
         │             │ • user_id       │
         │             │ • sys_role      │
         │             │ • created_at    │
         │             │ • updated_at    │
         │             └─────────────────┘
         │
         │             ┌─────────────────┐
         │             │    releases     │
         │             │                 │
         │             │ • id (PK)       │
         │             │ • name          │
         │             │ • target_date   │
         │             │ • platform_update│
         │             │ • config_update │
         │             │ • state         │
         │             │ • tenant_id (FK)│
         │             │ • release_notes │
         │             │ • release_summary│
         │             │ • is_archived   │
         │             │ • targets       │
         │             │ • created_at    │
         │             │ • updated_at    │
         │             └─────────────────┘
         │                      │
         │                      │
         │             ┌─────────────────┐
         │             │  release_teams  │
         │             │                 │
         │             │ • release_id (FK)│
         │             │ • team_id (FK)  │
         │             │ • tenant_id (FK)│
         │             │ • created_at    │
         │             │ • updated_at    │
         │             └─────────────────┘
         │
         │             ┌─────────────────┐
         │             │    features     │
         │             │                 │
         │             │ • id (PK)       │
         │             │ • release_id (FK)│
         │             │ • name          │
         │             │ • jira_ticket   │
         │             │ • description   │
         │             │ • dri_member_id │
         │             │ • is_platform   │
         │             │ • is_ready      │
         │             │ • tenant_id (FK)│
         │             │ • created_at    │
         │             │ • updated_at    │
         │             └─────────────────┘
         │
         │             ┌─────────────────┐
         │             │member_release_state│
         │             │                 │
         │             │ • release_id (FK)│
         │             │ • member_id (FK)│
         │             │ • is_ready      │
         │             │ • tenant_id (FK)│
         │             │ • created_at    │
         │             │ • updated_at    │
         │             └─────────────────┘
         │
         │             ┌─────────────────┐
         │             │  activity_log   │
         │             │                 │
         │             │ • id (PK)       │
         │             │ • release_id (FK)│
         │             │ • feature_id (FK)│
         │             │ • team_id (FK)  │
         │             │ • member_id (FK)│
         │             │ • activity_type │
         │             │ • activity_details│
         │             │ • tenant_id (FK)│
         │             │ • created_at    │
         │             └─────────────────┘
         │
         └───────────────────────────────────┘
```

### Database Objects Summary

| Object Type | Count | Description |
|-------------|-------|-------------|
| **Tables** | 12 | Core data tables with multi-tenancy |
| **Indexes** | 25+ | Performance optimization |
| **Triggers** | 12 | Automatic updated_at maintenance |
| **Functions** | 6 | Utility and security functions |
| **Policies** | 30+ | Row-Level Security policies |
| **Constraints** | 20+ | Data integrity constraints |

---

## Multi-Tenancy Design

### Tenant Isolation Strategy
The database implements **complete tenant isolation** using Row-Level Security (RLS) policies. Every table includes a `tenant_id` foreign key that references the `tenants` table.

### Key Multi-Tenancy Features:
- **Complete Data Isolation**: All data is scoped to specific tenants
- **RLS Policies**: Automatic filtering of data based on user's tenant
- **Tenant-Specific Operations**: All CRUD operations respect tenant boundaries
- **Cross-Tenant Security**: Users cannot access data from other tenants

### Tenant Management:
- **Tenant Creation**: New tenants are created through the `tenants` table
- **User Assignment**: Users are assigned to tenants via `tenant_user_map`
- **Default Tenant**: Users can belong to multiple tenants with different roles

---

## Table Definitions

### 1. Tenants Table

**Purpose**: Store tenant/organization information for multi-tenancy

```sql
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:
- `id`: Unique identifier for the tenant (UUID)
- `name`: Tenant/organization name
- `created_at`: Timestamp when the tenant was created
- `updated_at`: Timestamp when the tenant was last updated

**Constraints**:
- Primary Key: `id`
- Not Null: `name`, `created_at`, `updated_at`

### 2. Tenant User Map Table

**Purpose**: Manage many-to-many relationship between users and tenants

```sql
CREATE TABLE tenant_user_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:
- `id`: Unique identifier for the mapping
- `tenant_id`: Foreign key to tenants table
- `user_id`: Supabase Auth user ID
- `created_at`: Timestamp when the mapping was created
- `updated_at`: Timestamp when the mapping was last updated

### 3. Members Table

**Purpose**: Store member information within tenant context

```sql
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  nickname text,
  member_role text DEFAULT 'user' NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT members_role_check CHECK (member_role = ANY (ARRAY['member', 'release_manager', 'admin']))
);
```

**Columns**:
- `id`: Unique identifier for the member (UUID)
- `user_id`: Supabase Auth user ID
- `email`: Member's email address
- `full_name`: Member's complete name
- `nickname`: Optional nickname or display name
- `member_role`: Role within the tenant ('member', 'release_manager', 'admin')
- `tenant_id`: Foreign key to tenants table
- `created_at`: Timestamp when the member was created
- `updated_at`: Timestamp when the member was last updated

**Constraints**:
- Primary Key: `id`
- Foreign Key: `tenant_id` references `tenants(id)`
- Check: `member_role` must be one of the valid roles
- Not Null: `email`, `full_name`, `member_role`, `tenant_id`, `created_at`, `updated_at`

### 4. System Roles Table

**Purpose**: Store system-wide user roles (separate from tenant-specific roles)

```sql
CREATE TABLE sys_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sys_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_role_check CHECK (sys_role = ANY (ARRAY['admin', 'user']))
);
```

**Columns**:
- `id`: Unique identifier for the system role (UUID)
- `user_id`: Supabase Auth user ID
- `sys_role`: System-wide role ('admin', 'user')
- `created_at`: Timestamp when the role was created
- `updated_at`: Timestamp when the role was last updated

**Constraints**:
- Primary Key: `id`
- Check: `sys_role` must be 'admin' or 'user'
- Not Null: `user_id`, `sys_role`, `created_at`, `updated_at`

### 5. Targets Table

**Purpose**: Store deployment targets/environments per tenant

```sql
CREATE TABLE targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_name text NOT NULL,
  name text NOT NULL,
  is_live boolean DEFAULT false NOT NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:
- `id`: Unique identifier for the target (UUID)
- `short_name`: Short identifier (e.g., 'prod', 'staging')
- `name`: Full target name (e.g., 'Production Environment')
- `is_live`: Boolean flag indicating if this is a live environment
- `tenant_id`: Foreign key to tenants table
- `created_at`: Timestamp when the target was created
- `updated_at`: Timestamp when the target was last updated

### 6. Teams Table

**Purpose**: Store team information within tenant context

```sql
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:
- `id`: Unique identifier for the team (UUID)
- `name`: Team name
- `description`: Optional description of the team's purpose
- `tenant_id`: Foreign key to tenants table
- `created_at`: Timestamp when the team was created
- `updated_at`: Timestamp when the team was last updated

### 7. Team Members Table

**Purpose**: Manage many-to-many relationship between teams and members within tenant context

```sql
CREATE TABLE team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, member_id)
);
```

**Columns**:
- `team_id`: Foreign key to teams table
- `member_id`: Foreign key to members table
- `tenant_id`: Foreign key to tenants table
- `created_at`: Timestamp when the membership was created
- `updated_at`: Timestamp when the membership was last updated

### 8. Releases Table

**Purpose**: Store release information and track release lifecycle within tenant context

```sql
CREATE TABLE releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_date date NOT NULL,
  platform_update boolean NOT NULL DEFAULT false,
  config_update boolean NOT NULL DEFAULT false,
  state text NOT NULL CHECK (state IN ('pending','ready','past_due','complete','cancelled')),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  release_notes text,
  release_summary text,
  is_archived boolean DEFAULT false,
  targets text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:
- `id`: Unique identifier for the release (UUID)
- `name`: Release name (e.g., "v2.1.0 - Feature Release")
- `target_date`: Target deployment date
- `platform_update`: Boolean flag indicating platform updates
- `config_update`: Boolean flag indicating configuration changes
- `state`: Current state of the release
- `tenant_id`: Foreign key to tenants table
- `release_notes`: Detailed release notes
- `release_summary`: Brief release summary
- `is_archived`: Boolean flag indicating if release is archived
- `targets`: Array of target environment names
- `created_at`: Timestamp when the release was created
- `updated_at`: Timestamp when the release was last updated

### 9. Release Teams Table

**Purpose**: Manage many-to-many relationship between releases and teams within tenant context

```sql
CREATE TABLE release_teams (
  release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (release_id, team_id)
);
```

### 10. Features Table

**Purpose**: Store feature information and track feature readiness within tenant context

```sql
CREATE TABLE features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  name text NOT NULL,
  jira_ticket text,
  description text,
  dri_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  is_platform boolean NOT NULL DEFAULT false,
  is_ready boolean NOT NULL DEFAULT false,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:
- `id`: Unique identifier for the feature (UUID)
- `release_id`: Foreign key to releases table
- `name`: Feature name
- `jira_ticket`: Optional JIRA ticket number
- `description`: Optional feature description
- `dri_member_id`: Directly Responsible Individual (foreign key to members)
- `is_platform`: Boolean flag indicating platform-level feature
- `is_ready`: Boolean flag indicating feature readiness
- `tenant_id`: Foreign key to tenants table
- `created_at`: Timestamp when the feature was created
- `updated_at`: Timestamp when the feature was last updated

### 11. Member Release State Table

**Purpose**: Track individual member readiness for specific releases within tenant context

```sql
CREATE TABLE member_release_state (
  release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  is_ready boolean NOT NULL DEFAULT false,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (release_id, member_id)
);
```

### 12. Activity Log Table

**Purpose**: Comprehensive audit trail of all system activities within tenant context

```sql
CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES releases(id) ON DELETE CASCADE,
  feature_id uuid REFERENCES features(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  activity_details jsonb,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:
- `id`: Unique identifier for the activity log entry (UUID)
- `release_id`: Optional foreign key to releases table
- `feature_id`: Optional foreign key to features table
- `team_id`: Optional foreign key to teams table
- `member_id`: Optional foreign key to members table
- `activity_type`: Type of activity performed
- `activity_details`: JSON object with additional activity details
- `tenant_id`: Foreign key to tenants table
- `created_at`: Timestamp when the activity occurred

---

## Relationships & Constraints

### Entity Relationship Diagram

```
tenants (1) ──── (N) tenant_user_map (N) ──── (1) auth.users
  │
  │ (1) ──── (N) members
  │              │
  │              │ (1) ──── (N) sys_roles
  │              │
  │              │ (1) ──── (N) team_members (N) ──── (1) teams
  │              │
  │              │ (1) ──── (N) features
  │              │
  │              │ (1) ──── (N) member_release_state
  │              │
  │              └─── (1) ──── (N) activity_log
  │
  │ (1) ──── (N) targets
  │
  │ (1) ──── (N) releases
  │              │
  │              │ (1) ──── (N) release_teams (N) ──── (1) teams
  │              │
  │              │ (1) ──── (N) features
  │              │
  │              │ (1) ──── (N) member_release_state
  │              │
  │              └─── (1) ──── (N) activity_log
  │
  └─── (1) ──── (N) activity_log
```

### Foreign Key Relationships

| Table | Column | References | On Delete | On Update |
|-------|--------|------------|-----------|-----------|
| `tenant_user_map` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |
| `members` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |
| `targets` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |
| `teams` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |
| `team_members` | `team_id` | `teams(id)` | CASCADE | CASCADE |
| `team_members` | `member_id` | `members(id)` | CASCADE | CASCADE |
| `team_members` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |
| `releases` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |
| `release_teams` | `release_id` | `releases(id)` | CASCADE | CASCADE |
| `release_teams` | `team_id` | `teams(id)` | CASCADE | CASCADE |
| `release_teams` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |
| `features` | `release_id` | `releases(id)` | CASCADE | CASCADE |
| `features` | `dri_member_id` | `members(id)` | SET NULL | CASCADE |
| `features` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |
| `member_release_state` | `release_id` | `releases(id)` | CASCADE | CASCADE |
| `member_release_state` | `member_id` | `members(id)` | CASCADE | CASCADE |
| `member_release_state` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |
| `activity_log` | `release_id` | `releases(id)` | CASCADE | CASCADE |
| `activity_log` | `feature_id` | `features(id)` | CASCADE | CASCADE |
| `activity_log` | `team_id` | `teams(id)` | CASCADE | CASCADE |
| `activity_log` | `member_id` | `members(id)` | SET NULL | CASCADE |
| `activity_log` | `tenant_id` | `tenants(id)` | CASCADE | CASCADE |

---

## Row-Level Security (RLS)

### RLS Policy Overview
All tables have Row-Level Security enabled with policies that ensure complete tenant isolation. Users can only access data belonging to their assigned tenants.

### Key RLS Features:
- **Tenant Isolation**: All queries automatically filter by tenant_id
- **User Context**: Policies use `auth.uid()` to identify the current user
- **Role-Based Access**: Different policies for different user roles
- **Automatic Filtering**: No manual tenant filtering required in application code

### Example RLS Policy:
```sql
CREATE POLICY "Users can view their own tenant data" ON members
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM tenant_user_map 
    WHERE user_id = auth.uid()
  )
);
```

---

## Functions & Triggers

### Utility Functions

#### 1. `create_member_from_auth_user(auth_user_id, nickname, member_role)`
**Purpose**: Create a new member from Supabase Auth user
**Parameters**:
- `auth_user_id`: UUID of the auth user
- `nickname`: Optional nickname
- `member_role`: Role within tenant ('member', 'release_manager', 'admin')

#### 2. `get_auth_users_by_email(email_substring)`
**Purpose**: Search auth users by email substring
**Returns**: Table with user ID, email, and full name

#### 3. `get_user_role(user_uuid)`
**Purpose**: Get the system role of a user
**Returns**: Text role ('admin' or 'user')

#### 4. `is_admin(user_id)`
**Purpose**: Check if a user has admin role
**Returns**: Boolean

#### 5. `set_user_role(user_uuid, new_role)`
**Purpose**: Set or update a user's system role
**Parameters**:
- `user_uuid`: UUID of the user
- `new_role`: New role to assign

### Triggers

#### Automatic Updated At Triggers
All tables have triggers that automatically update the `updated_at` column when records are modified:

```sql
CREATE TRIGGER set_table_updated_at 
BEFORE UPDATE ON table_name 
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Data Types & Validation

### Standard Data Types
- **UUID**: Primary keys and foreign keys
- **Text**: Names, descriptions, and identifiers
- **Boolean**: Flags and status indicators
- **Date/Timestamp**: Temporal data with timezone support
- **JSONB**: Flexible structured data (activity details)
- **Text Arrays**: Multiple values (targets)

### Validation Constraints
- **Check Constraints**: Enum-like validation for status fields
- **Not Null**: Required fields
- **Unique**: Email addresses, names where appropriate
- **Foreign Keys**: Referential integrity

### Example Constraints:
```sql
-- Role validation
CONSTRAINT members_role_check CHECK (
  member_role = ANY (ARRAY['member', 'release_manager', 'admin'])
)

-- State validation
CONSTRAINT releases_state_check CHECK (
  state IN ('pending','ready','past_due','complete','cancelled')
)
```

---

## Audit Trail

### Activity Logging
The `activity_log` table provides comprehensive audit trail capabilities:

- **Automatic Logging**: All significant operations are logged
- **Flexible Details**: JSONB field allows for detailed activity information
- **Multi-Entity Tracking**: Can reference releases, features, teams, or members
- **Tenant Scoped**: All logs are scoped to specific tenants

### Activity Types
Common activity types include:
- `release_created`, `release_updated`, `release_deleted`
- `feature_created`, `feature_updated`, `feature_deleted`
- `member_joined_team`, `member_left_team`
- `release_state_changed`, `feature_ready_changed`

### Example Activity Log Entry:
```json
{
  "activity_type": "feature_ready_changed",
  "activity_details": {
    "feature_name": "User Authentication",
    "previous_state": false,
    "new_state": true,
    "changed_by": "john.doe@example.com"
  }
}
```

---

## Migration Strategy

### Migration Files
All database changes are managed through migration files in `/database/migrations/`:

- **Versioned**: Each migration has a timestamp prefix
- **Reversible**: Migrations can be rolled back if needed
- **Documented**: Each migration includes comments explaining the change
- **Tested**: Migrations are tested in development before production

### Migration Naming Convention
```
YYYYMMDD_description.sql
```

### Example Migration Files:
- `20240115_add_tenants_table.sql`
- `20240116_add_multi_tenancy_to_existing_tables.sql`
- `20240117_add_activity_log_table.sql`

### Migration Process
1. **Development**: Create and test migration in development environment
2. **Staging**: Apply migration to staging environment
3. **Production**: Apply migration to production during maintenance window
4. **Verification**: Verify data integrity and application functionality

---

## Database Conventions

### Naming Conventions

#### Tables
- **Singular nouns**: `member`, `team`, `release`, `feature`
- **Snake case**: `member_release_state`, `activity_log`
- **Descriptive**: Names clearly indicate purpose

#### Columns
- **Primary keys**: Always named `id` (UUID)
- **Foreign keys**: Named `{table_name}_id` (e.g., `tenant_id`, `member_id`)
- **Timestamps**: `created_at`, `updated_at` (timestamptz)
- **Boolean flags**: `is_` prefix (e.g., `is_ready`, `is_live`)
- **Status fields**: Descriptive names (e.g., `state`, `member_role`)

#### Indexes
- **Primary keys**: Automatic indexes
- **Foreign keys**: Automatic indexes
- **Custom indexes**: `idx_{table}_{column}` format
- **Composite indexes**: `idx_{table}_{column1}_{column2}` format

### Data Integrity

#### Constraints
- **Primary Keys**: UUID with `gen_random_uuid()` default
- **Foreign Keys**: CASCADE delete for child records, SET NULL for optional references
- **Check Constraints**: Validate enum-like fields
- **Not Null**: Required fields explicitly marked

#### Default Values
- **Timestamps**: `now()` for created_at, updated_at
- **UUIDs**: `gen_random_uuid()` for primary keys
- **Booleans**: `false` for most flags
- **Arrays**: Empty array `{}` for text arrays

### Performance Considerations

#### Indexing Strategy
- **Primary keys**: Automatic unique indexes
- **Foreign keys**: Automatic indexes
- **Query patterns**: Indexes on frequently queried columns
- **Composite indexes**: For multi-column WHERE clauses
- **Partial indexes**: For filtered queries (e.g., active records only)

#### Query Optimization
- **Tenant filtering**: Always include tenant_id in WHERE clauses
- **Join optimization**: Use appropriate join types
- **Pagination**: Use LIMIT and OFFSET for large result sets
- **Selectivity**: Choose indexes based on column selectivity

### Security Best Practices

#### Row-Level Security
- **Tenant isolation**: All tables have tenant-based RLS policies
- **User context**: Policies use `auth.uid()` for user identification
- **Role-based access**: Different policies for different user roles
- **Minimal privileges**: Grant only necessary permissions

#### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Audit trail**: Comprehensive logging of all operations
- **Input validation**: Application-level validation before database operations
- **SQL injection prevention**: Use parameterized queries

### Maintenance Procedures

#### Regular Maintenance
- **Vacuum**: Regular VACUUM operations for table maintenance
- **Analyze**: Update table statistics for query optimization
- **Backup**: Daily automated backups with point-in-time recovery
- **Monitoring**: Database performance and error monitoring

#### Schema Evolution
- **Backward compatibility**: Maintain compatibility during migrations
- **Data migration**: Proper data transformation during schema changes
- **Rollback planning**: Ability to rollback problematic migrations
- **Testing**: Thorough testing of all schema changes

This comprehensive database design provides a robust, scalable, and secure foundation for the Release Management Checklist application with complete multi-tenancy support and comprehensive audit capabilities. 