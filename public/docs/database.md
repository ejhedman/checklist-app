# Database Documentation - Release Management Checklist App

## Table of Contents

1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Table Definitions](#table-definitions)
4. [Relationships & Constraints](#relationships--constraints)
5. [Indexes & Performance](#indexes--performance)
6. [Row-Level Security (RLS)](#row-level-security-rls)
7. [Triggers & Functions](#triggers--functions)
8. [Data Types & Validation](#data-types--validation)
9. [Audit Trail](#audit-trail)
10. [Backup & Recovery](#backup--recovery)
11. [Migration Strategy](#migration-strategy)
12. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Overview

### Database Technology
- **Platform**: Supabase (PostgreSQL 15)
- **Location**: Cloud-hosted with automatic backups
- **Connection**: SSL/TLS encrypted connections
- **Authentication**: Supabase Auth integration

### Design Principles
- **Normalization**: Third Normal Form (3NF) compliance
- **Security**: Row-Level Security (RLS) on all tables
- **Audit Trail**: Automatic tracking of all changes
- **Performance**: Optimized indexes for common queries
- **Scalability**: Designed for 10,000+ users and 1,000+ releases/year

### Schema Version
- **Current Version**: 1.0.0
- **Last Updated**: January 2024
- **Migration Scripts**: Available in `/database/` directory

---

## Database Architecture

### High-Level Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     users       │    │     teams       │    │    releases     │
│                 │    │                 │    │                 │
│ • id (PK)       │    │ • id (PK)       │    │ • id (PK)       │
│ • email         │    │ • name          │    │ • name          │
│ • full_name     │    │ • description   │    │ • target_date   │
│ • nickname      │    │ • created_at    │    │ • platform_update│
│ • created_at    │    │ • updated_at    │    │ • config_update │
│ • updated_at    │    └─────────────────┘    │ • state         │
└─────────────────┘                           │ • created_at    │
         │                                    │ • updated_at    │
         │                                    └─────────────────┘
         │                                             │
         │                                    ┌─────────────────┐
         │                                    │  release_teams  │
         │                                    │                 │
         │                                    │ • release_id (FK)│
         │                                    │ • team_id (FK)  │
         │                                    │ • created_at    │
         │                                    │ • updated_at    │
         │                                    └─────────────────┘
         │                                             │
         │                                    ┌─────────────────┐
         │                                    │    features     │
         │                                    │                 │
         │                                    │ • id (PK)       │
         │                                    │ • release_id (FK)│
         │                                    │ • name          │
         │                                    │ • jira_ticket   │
         │                                    │ • description   │
         │                                    │ • dri_user_id (FK)│
         │                                    │ • is_platform   │
         │                                    │ • is_ready      │
         │                                    │ • created_at    │
         │                                    │ • updated_at    │
         │                                    └─────────────────┘
         │
         │                           ┌─────────────────┐
         │                           │   team_users    │
         │                           │                 │
         │                           │ • team_id (FK)  │
         │                           │ • user_id (FK)  │
         │                           │ • created_at    │
         │                           │ • updated_at    │
         │                           └─────────────────┘
         │
         │                           ┌─────────────────┐
         │                           │user_release_state│
         │                           │                 │
         │                           │ • release_id (FK)│
         │                           │ • user_id (FK)  │
         │                           │ • is_ready      │
         │                           │ • created_at    │
         │                           │ • updated_at    │
         │                           └─────────────────┘
         │
         └───────────────────────────────────┘
```

### Database Objects Summary

| Object Type | Count | Description |
|-------------|-------|-------------|
| **Tables** | 7 | Core data tables |
| **Indexes** | 15 | Performance optimization |
| **Triggers** | 7 | Automatic updated_at maintenance |
| **Functions** | 1 | Utility functions |
| **Policies** | 21 | Row-Level Security policies |
| **Constraints** | 12 | Data integrity constraints |

---

## Table Definitions

### 1. Users Table

**Purpose**: Store user account information and profiles

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  nickname text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:
- `id`: Unique identifier for the user (UUID)
- `email`: User's email address (unique, used for authentication)
- `full_name`: User's complete name
- `nickname`: Optional nickname or display name
- `created_at`: Timestamp when the user was created
- `updated_at`: Timestamp when the user was last updated

**Constraints**:
- Primary Key: `id`
- Unique: `email`
- Not Null: `email`, `full_name`, `created_at`, `updated_at`

**Indexes**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. Teams Table

**Purpose**: Store team information and organization structure

```sql
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:
- `id`: Unique identifier for the team (UUID)
- `name`: Team name (unique across the system)
- `description`: Optional description of the team's purpose
- `created_at`: Timestamp when the team was created
- `updated_at`: Timestamp when the team was last updated

**Constraints**:
- Primary Key: `id`
- Unique: `name`
- Not Null: `name`, `created_at`, `updated_at`

**Indexes**:
```sql
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_created_at ON teams(created_at);
```

### 3. Team Users Table (Many-to-Many)

**Purpose**: Manage the many-to-many relationship between users and teams

```sql
CREATE TABLE team_users (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
```

**Columns**:
- `team_id`: Foreign key to teams table
- `user_id`: Foreign key to users table
- `created_at`: Timestamp when the membership was created
- `updated_at`: Timestamp when the membership was last updated

**Constraints**:
- Primary Key: `(team_id, user_id)`
- Foreign Key: `team_id` references `teams(id)`
- Foreign Key: `user_id` references `users(id)`
- Cascade Delete: When team or user is deleted, membership is removed

**Indexes**:
```sql
CREATE INDEX idx_team_users_team_id ON team_users(team_id);
CREATE INDEX idx_team_users_user_id ON team_users(user_id);
CREATE INDEX idx_team_users_created_at ON team_users(created_at);
```

### 4. Releases Table

**Purpose**: Store release information and track release lifecycle

```sql
CREATE TABLE releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_date date NOT NULL,
  platform_update boolean NOT NULL DEFAULT false,
  config_update boolean NOT NULL DEFAULT false,
  state text NOT NULL CHECK (state IN ('pending','ready','past_due','complete','cancelled')),
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
- `state`: Current state of the release (constrained to valid states)
- `created_at`: Timestamp when the release was created
- `updated_at`: Timestamp when the release was last updated

**Constraints**:
- Primary Key: `id`
- Check: `state` must be one of the valid states
- Not Null: `name`, `target_date`, `platform_update`, `config_update`, `state`, `created_at`, `updated_at`

**Indexes**:
```sql
CREATE INDEX idx_releases_target_date ON releases(target_date);
CREATE INDEX idx_releases_state ON releases(state);
CREATE INDEX idx_releases_created_at ON releases(created_at);
CREATE INDEX idx_releases_state_target_date ON releases(state, target_date);
```

### 5. Release Teams Table (Many-to-Many)

**Purpose**: Manage the many-to-many relationship between releases and teams

```sql
CREATE TABLE release_teams (
  release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (release_id, team_id)
);
```

**Columns**:
- `release_id`: Foreign key to releases table
- `team_id`: Foreign key to teams table
- `created_at`: Timestamp when the assignment was created
- `updated_at`: Timestamp when the assignment was last updated

**Constraints**:
- Primary Key: `(release_id, team_id)`
- Foreign Key: `release_id` references `releases(id)`
- Foreign Key: `team_id` references `teams(id)`
- Cascade Delete: When release or team is deleted, assignment is removed

**Indexes**:
```sql
CREATE INDEX idx_release_teams_release_id ON release_teams(release_id);
CREATE INDEX idx_release_teams_team_id ON release_teams(team_id);
CREATE INDEX idx_release_teams_created_at ON release_teams(created_at);
```

### 6. Features Table

**Purpose**: Store feature information and track feature readiness

```sql
CREATE TABLE features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  name text NOT NULL,
  jira_ticket text,
  description text,
  dri_user_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  is_platform boolean NOT NULL DEFAULT false,
  is_ready boolean NOT NULL DEFAULT false,
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
- `dri_user_id`: Directly Responsible Individual (foreign key to users)
- `is_platform`: Boolean flag indicating platform-level feature
- `is_ready`: Boolean flag indicating feature readiness
- `created_at`: Timestamp when the feature was created
- `updated_at`: Timestamp when the feature was last updated

**Constraints**:
- Primary Key: `id`
- Foreign Key: `release_id` references `releases(id)`
- Foreign Key: `dri_user_id` references `users(id)` (SET NULL on delete)
- Not Null: `release_id`, `name`, `dri_user_id`, `is_platform`, `is_ready`, `created_at`, `updated_at`

**Indexes**:
```sql
CREATE INDEX idx_features_release_id ON features(release_id);
CREATE INDEX idx_features_dri_user_id ON features(dri_user_id);
CREATE INDEX idx_features_is_ready ON features(is_ready);
CREATE INDEX idx_features_created_at ON features(created_at);
```

### 7. User Release State Table

**Purpose**: Track individual user readiness for specific releases

```sql
CREATE TABLE user_release_state (
  release_id uuid NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_ready boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (release_id, user_id)
);
```

**Columns**:
- `release_id`: Foreign key to releases table
- `user_id`: Foreign key to users table
- `is_ready`: Boolean flag indicating user readiness
- `created_at`: Timestamp when the state was created
- `updated_at`: Timestamp when the state was last updated

**Constraints**:
- Primary Key: `(release_id, user_id)`
- Foreign Key: `release_id` references `releases(id)`
- Foreign Key: `user_id` references `users(id)`
- Cascade Delete: When release or user is deleted, state is removed
- Not Null: `release_id`, `user_id`, `is_ready`, `created_at`, `updated_at`

**Indexes**:
```sql
CREATE INDEX idx_user_release_state_release_id ON user_release_state(release_id);
CREATE INDEX idx_user_release_state_user_id ON user_release_state(user_id);
CREATE INDEX idx_user_release_state_is_ready ON user_release_state(is_ready);
CREATE INDEX idx_user_release_state_created_at ON user_release_state(created_at);
```

---

## Relationships & Constraints

### Entity Relationship Diagram

```
users (1) ──── (N) team_users (N) ──── (1) teams
  │                                              │
  │                                              │
  │ (1) ──── (N) features                       │
  │                                              │
  │                                              │
  │ (1) ──── (N) user_release_state             │
  │                                              │
  │                                              │
releases (1) ──── (N) release_teams (N) ──── (1) teams
  │
  │ (1) ──── (N) features
  │
  │ (1) ──── (N) user_release_state
```

### Foreign Key Relationships

| Table | Column | References | On Delete | On Update |
|-------|--------|------------|-----------|-----------|
| `team_users` | `team_id` | `teams.id` | CASCADE | CASCADE |
| `team_users` | `user_id` | `users.id` | CASCADE | CASCADE |
| `release_teams` | `release_id` | `releases.id` | CASCADE | CASCADE |
| `release_teams` | `team_id` | `teams.id` | CASCADE | CASCADE |
| `features` | `release_id` | `releases.id` | CASCADE | CASCADE |
| `features` | `dri_user_id` | `users.id` | SET NULL | CASCADE |
| `user_release_state` | `release_id` | `releases.id` | CASCADE | CASCADE |
| `user_release_state` | `user_id` | `users.id` | CASCADE | CASCADE |

### Check Constraints

#### Release State Validation
```sql
ALTER TABLE releases 
ADD CONSTRAINT check_release_state 
CHECK (state IN ('pending','ready','past_due','complete','cancelled'));
```

#### Date Validation
```sql
-- Ensure target_date is not in the past for new releases
ALTER TABLE releases 
ADD CONSTRAINT check_target_date_future 
CHECK (target_date >= CURRENT_DATE);
```

### Unique Constraints

| Table | Columns | Constraint Name |
|-------|---------|-----------------|
| `users` | `email` | `users_email_key` |
| `teams` | `name` | `teams_name_key` |
| `team_users` | `(team_id, user_id)` | `team_users_pkey` |
| `release_teams` | `(release_id, team_id)` | `release_teams_pkey` |
| `user_release_state` | `(release_id, user_id)` | `user_release_state_pkey` |

---

## Indexes & Performance

### Primary Indexes
All tables have primary key indexes automatically created by PostgreSQL.

### Secondary Indexes

#### Performance Indexes
```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Teams table
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_created_at ON teams(created_at);

-- Team Users table
CREATE INDEX idx_team_users_team_id ON team_users(team_id);
CREATE INDEX idx_team_users_user_id ON team_users(user_id);
CREATE INDEX idx_team_users_created_at ON team_users(created_at);

-- Releases table
CREATE INDEX idx_releases_target_date ON releases(target_date);
CREATE INDEX idx_releases_state ON releases(state);
CREATE INDEX idx_releases_created_at ON releases(created_at);
CREATE INDEX idx_releases_state_target_date ON releases(state, target_date);

-- Release Teams table
CREATE INDEX idx_release_teams_release_id ON release_teams(release_id);
CREATE INDEX idx_release_teams_team_id ON release_teams(team_id);
CREATE INDEX idx_release_teams_created_at ON release_teams(created_at);

-- Features table
CREATE INDEX idx_features_release_id ON features(release_id);
CREATE INDEX idx_features_dri_user_id ON features(dri_user_id);
CREATE INDEX idx_features_is_ready ON features(is_ready);
CREATE INDEX idx_features_created_at ON features(created_at);

-- User Release State table
CREATE INDEX idx_user_release_state_release_id ON user_release_state(release_id);
CREATE INDEX idx_user_release_state_user_id ON user_release_state(user_id);
CREATE INDEX idx_user_release_state_is_ready ON user_release_state(is_ready);
CREATE INDEX idx_user_release_state_created_at ON user_release_state(created_at);
```

#### Composite Indexes
```sql
-- Optimize release queries by state and date
CREATE INDEX idx_releases_state_target_date ON releases(state, target_date);

-- Optimize team membership queries
CREATE INDEX idx_team_users_user_team ON team_users(user_id, team_id);

-- Optimize release team queries
CREATE INDEX idx_release_teams_release_team ON release_teams(release_id, team_id);
```

### Query Optimization

#### Common Query Patterns
1. **User's teams**: `idx_team_users_user_id`
2. **Release's teams**: `idx_release_teams_release_id`
3. **User's releases**: `idx_release_teams_team_id` + `idx_team_users_user_id`
4. **Release features**: `idx_features_release_id`
5. **User's features**: `idx_features_dri_user_id`
6. **Release readiness**: `idx_user_release_state_release_id` + `idx_features_release_id`

#### Performance Monitoring
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Row-Level Security (RLS)

### Overview
Row-Level Security (RLS) is enabled on all tables to ensure users can only access data they're authorized to see. Policies are based on user authentication and team membership.

### RLS Policies

#### Users Table Policies
```sql
-- Users can only see their own profile
CREATE POLICY select_own_profile ON users
FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY update_own_profile ON users
FOR UPDATE USING (id = auth.uid());

-- Administrators can see all users
CREATE POLICY admin_select_users ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'administrator'
  )
);
```

#### Teams Table Policies
```sql
-- Users can only see teams they belong to
CREATE POLICY select_teams ON teams
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_users tu
    WHERE tu.team_id = id AND tu.user_id = auth.uid()
  )
);

-- Administrators and team owners can update teams
CREATE POLICY update_teams ON teams
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'administrator'
  )
);

-- Administrators can create teams
CREATE POLICY insert_teams ON teams
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'administrator'
  )
);
```

#### Team Users Table Policies
```sql
-- Users can see team memberships for teams they belong to
CREATE POLICY select_team_users ON team_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_users tu
    WHERE tu.team_id = team_id AND tu.user_id = auth.uid()
  )
);

-- Administrators can manage team memberships
CREATE POLICY manage_team_users ON team_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'administrator'
  )
);
```

#### Releases Table Policies
```sql
-- Users can only see releases involving their teams
CREATE POLICY select_releases ON releases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM release_teams rt
    JOIN team_users tu ON tu.team_id = rt.team_id
    WHERE rt.release_id = id AND tu.user_id = auth.uid()
  )
);

-- Release managers can create releases
CREATE POLICY insert_releases ON releases
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('administrator', 'release_manager')
  )
);

-- Release managers can update releases
CREATE POLICY update_releases ON releases
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('administrator', 'release_manager')
  )
);
```

#### Release Teams Table Policies
```sql
-- Users can see release team assignments for releases they have access to
CREATE POLICY select_release_teams ON release_teams
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM release_teams rt
    JOIN team_users tu ON tu.team_id = rt.team_id
    WHERE rt.release_id = release_id AND tu.user_id = auth.uid()
  )
);

-- Release managers can manage release team assignments
CREATE POLICY manage_release_teams ON release_teams
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('administrator', 'release_manager')
  )
);
```

#### Features Table Policies
```sql
-- Users can see features for releases they have access to
CREATE POLICY select_features ON features
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM release_teams rt
    JOIN team_users tu ON tu.team_id = rt.team_id
    WHERE rt.release_id = release_id AND tu.user_id = auth.uid()
  )
);

-- DRIs can update their assigned features
CREATE POLICY update_features ON features
FOR UPDATE USING (
  dri_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('administrator', 'release_manager')
  )
);

-- Release managers can create features
CREATE POLICY insert_features ON features
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('administrator', 'release_manager')
  )
);
```

#### User Release State Table Policies
```sql
-- Users can see readiness status for releases they have access to
CREATE POLICY select_user_release_state ON user_release_state
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM release_teams rt
    JOIN team_users tu ON tu.team_id = rt.team_id
    WHERE rt.release_id = release_id AND tu.user_id = auth.uid()
  )
);

-- Users can update their own readiness status
CREATE POLICY update_own_readiness ON user_release_state
FOR UPDATE USING (user_id = auth.uid());

-- System can insert readiness records
CREATE POLICY insert_user_release_state ON user_release_state
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'administrator'
  )
);
```

### RLS Best Practices

#### Policy Design Principles
1. **Principle of Least Privilege**: Users only see data they need
2. **Team-Based Access**: Access controlled by team membership
3. **Role-Based Permissions**: Different actions based on user roles
4. **Audit Trail**: All access logged for security monitoring

#### Testing RLS Policies
```sql
-- Test user access to teams
SELECT * FROM teams WHERE id IN (
  SELECT team_id FROM team_users WHERE user_id = auth.uid()
);

-- Test user access to releases
SELECT * FROM releases WHERE id IN (
  SELECT release_id FROM release_teams rt
  JOIN team_users tu ON tu.team_id = rt.team_id
  WHERE tu.user_id = auth.uid()
);

-- Test feature access
SELECT * FROM features WHERE release_id IN (
  SELECT release_id FROM release_teams rt
  JOIN team_users tu ON tu.team_id = rt.team_id
  WHERE tu.user_id = auth.uid()
);
```

---

## Triggers & Functions

### Updated At Trigger

#### Function Definition
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Trigger Applications
```sql
-- Users table
CREATE TRIGGER set_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Teams table
CREATE TRIGGER set_teams_updated_at 
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Team Users table
CREATE TRIGGER set_team_users_updated_at 
  BEFORE UPDATE ON team_users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Releases table
CREATE TRIGGER set_releases_updated_at 
  BEFORE UPDATE ON releases
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Release Teams table
CREATE TRIGGER set_release_teams_updated_at 
  BEFORE UPDATE ON release_teams
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Features table
CREATE TRIGGER set_features_updated_at 
  BEFORE UPDATE ON features
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- User Release State table
CREATE TRIGGER set_user_release_state_updated_at 
  BEFORE UPDATE ON user_release_state
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
```

### Release State Calculation Function

#### Function Definition
```sql
CREATE OR REPLACE FUNCTION calculate_release_state(release_uuid uuid)
RETURNS text AS $$
DECLARE
  release_record releases%ROWTYPE;
  all_teams_ready boolean;
  all_features_ready boolean;
  new_state text;
BEGIN
  -- Get release information
  SELECT * INTO release_record FROM releases WHERE id = release_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Release not found: %', release_uuid;
  END IF;
  
  -- Check if all teams are ready
  SELECT COUNT(*) = 0 INTO all_teams_ready
  FROM release_teams rt
  JOIN team_users tu ON tu.team_id = rt.team_id
  LEFT JOIN user_release_state urs ON urs.release_id = rt.release_id AND urs.user_id = tu.user_id
  WHERE rt.release_id = release_uuid
    AND (urs.is_ready = false OR urs.is_ready IS NULL);
  
  -- Check if all features are ready
  SELECT COUNT(*) = 0 INTO all_features_ready
  FROM features
  WHERE release_id = release_uuid AND is_ready = false;
  
  -- Determine new state
  IF release_record.state IN ('complete', 'cancelled') THEN
    new_state := release_record.state;
  ELSIF release_record.target_date < CURRENT_DATE THEN
    IF all_teams_ready AND all_features_ready THEN
      new_state := 'ready';
    ELSE
      new_state := 'past_due';
    END IF;
  ELSIF all_teams_ready AND all_features_ready THEN
    new_state := 'ready';
  ELSE
    new_state := 'pending';
  END IF;
  
  -- Update state if changed
  IF new_state != release_record.state THEN
    UPDATE releases SET state = new_state WHERE id = release_uuid;
  END IF;
  
  RETURN new_state;
END;
$$ LANGUAGE plpgsql;
```

#### Trigger for Automatic State Updates
```sql
-- Update release state when user readiness changes
CREATE OR REPLACE FUNCTION update_release_state_on_readiness()
RETURNS trigger AS $$
BEGIN
  PERFORM calculate_release_state(NEW.release_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_release_state_readiness
  AFTER INSERT OR UPDATE OR DELETE ON user_release_state
  FOR EACH ROW EXECUTE PROCEDURE update_release_state_on_readiness();

-- Update release state when feature readiness changes
CREATE OR REPLACE FUNCTION update_release_state_on_feature()
RETURNS trigger AS $$
BEGIN
  PERFORM calculate_release_state(NEW.release_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_release_state_feature
  AFTER INSERT OR UPDATE OR DELETE ON features
  FOR EACH ROW EXECUTE PROCEDURE update_release_state_on_feature();
```

---

## Data Types & Validation

### Data Type Standards

#### UUID Usage
- **Primary Keys**: All tables use UUID primary keys
- **Generation**: `gen_random_uuid()` for automatic generation
- **Benefits**: Distributed ID generation, no collisions, security

#### Timestamp Standards
- **Type**: `timestamptz` (timestamp with timezone)
- **Default**: `now()` for created_at and updated_at
- **Timezone**: UTC stored, client-side display conversion

#### Text Fields
- **Email**: Validated email format
- **Names**: Unicode text, reasonable length limits
- **Descriptions**: Optional, unlimited length

#### Boolean Fields
- **Default**: `false` for all boolean flags
- **Usage**: Feature flags, status indicators

### Validation Rules

#### Email Validation
```sql
-- Email format validation (basic)
ALTER TABLE users 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### Name Validation
```sql
-- Name length validation
ALTER TABLE users 
ADD CONSTRAINT check_full_name_length 
CHECK (length(full_name) >= 2 AND length(full_name) <= 100);

ALTER TABLE teams 
ADD CONSTRAINT check_team_name_length 
CHECK (length(name) >= 2 AND length(name) <= 50);
```

#### Date Validation
```sql
-- Target date must be in the future for new releases
ALTER TABLE releases 
ADD CONSTRAINT check_target_date_future 
CHECK (target_date >= CURRENT_DATE);
```

### Data Integrity Checks

#### Referential Integrity
- All foreign keys have proper constraints
- Cascade deletes where appropriate
- SET NULL for optional relationships

#### Business Rule Validation
```sql
-- Ensure at least one team is assigned to a release
CREATE OR REPLACE FUNCTION check_release_teams()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM release_teams WHERE release_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Release must have at least one team assigned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_release_teams
  AFTER INSERT ON releases
  FOR EACH ROW EXECUTE PROCEDURE check_release_teams();
```

---

## Audit Trail

### Audit Table Structure

#### Audit Log Table
```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES users(id),
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);
```

#### Audit Trigger Function
```sql
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, operation, old_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

#### Audit Triggers
```sql
-- Apply audit triggers to all tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE PROCEDURE audit_trigger_function();

CREATE TRIGGER audit_teams AFTER INSERT OR UPDATE OR DELETE ON teams
FOR EACH ROW EXECUTE PROCEDURE audit_trigger_function();

CREATE TRIGGER audit_releases AFTER INSERT OR UPDATE OR DELETE ON releases
FOR EACH ROW EXECUTE PROCEDURE audit_trigger_function();

CREATE TRIGGER audit_features AFTER INSERT OR UPDATE OR DELETE ON features
FOR EACH ROW EXECUTE PROCEDURE audit_trigger_function();

CREATE TRIGGER audit_user_release_state AFTER INSERT OR UPDATE OR DELETE ON user_release_state
FOR EACH ROW EXECUTE PROCEDURE audit_trigger_function();
```

### Audit Query Examples

#### Recent Changes
```sql
-- Get recent changes by user
SELECT 
  al.timestamp,
  al.table_name,
  al.operation,
  al.record_id,
  u.full_name as user_name
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
WHERE al.user_id = $1
ORDER BY al.timestamp DESC
LIMIT 50;
```

#### Release History
```sql
-- Get complete history of a release
SELECT 
  al.timestamp,
  al.operation,
  al.old_values,
  al.new_values,
  u.full_name as user_name
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
WHERE al.table_name = 'releases' 
  AND al.record_id = $1
ORDER BY al.timestamp;
```

---

## Backup & Recovery

### Backup Strategy

#### Automated Backups
- **Frequency**: Daily automated backups
- **Retention**: 30 days of daily backups
- **Location**: Supabase managed backups
- **Type**: Full database backups

#### Manual Backups
```sql
-- Create manual backup
pg_dump -h your-project.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql

-- Restore from backup
psql -h your-project.supabase.co -U postgres -d postgres < backup_file.sql
```

### Recovery Procedures

#### Point-in-Time Recovery
- **RTO**: <4 hours
- **RPO**: <1 hour
- **Method**: Supabase point-in-time recovery
- **Testing**: Monthly recovery testing

#### Data Recovery Scenarios

##### Scenario 1: Accidental Deletion
```sql
-- Recover deleted release
INSERT INTO releases (id, name, target_date, platform_update, config_update, state, created_at, updated_at)
SELECT id, name, target_date, platform_update, config_update, state, created_at, updated_at
FROM audit_logs
WHERE table_name = 'releases' 
  AND operation = 'DELETE' 
  AND record_id = $1
  AND timestamp = (
    SELECT MAX(timestamp) 
    FROM audit_logs 
    WHERE table_name = 'releases' 
      AND operation = 'DELETE' 
      AND record_id = $1
  );
```

##### Scenario 2: Data Corruption
```sql
-- Restore from last known good state
UPDATE releases 
SET state = 'pending', updated_at = now()
WHERE id = $1 AND state NOT IN ('complete', 'cancelled');
```

### Disaster Recovery

#### Recovery Time Objectives (RTO)
- **Critical**: 1 hour (core functionality)
- **Important**: 4 hours (full functionality)
- **Normal**: 24 hours (complete recovery)

#### Recovery Point Objectives (RPO)
- **Critical Data**: 1 hour maximum data loss
- **Standard Data**: 24 hours maximum data loss

---

## Migration Strategy

### Version Control

#### Migration Files
- **Location**: `/database/migrations/`
- **Naming**: `YYYYMMDD_HHMMSS_description.sql`
- **Versioning**: Sequential version numbers

#### Example Migration
```sql
-- Migration: 20240101_120000_add_audit_logs.sql
BEGIN;

-- Create audit_logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES users(id),
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Create indexes
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

COMMIT;
```

### Rollback Strategy

#### Rollback Migration
```sql
-- Rollback: 20240101_120000_add_audit_logs_rollback.sql
BEGIN;

-- Drop audit triggers
DROP TRIGGER IF EXISTS audit_users ON users;
DROP TRIGGER IF EXISTS audit_teams ON teams;
DROP TRIGGER IF EXISTS audit_releases ON releases;
DROP TRIGGER IF EXISTS audit_features ON features;
DROP TRIGGER IF EXISTS audit_user_release_state ON user_release_state;

-- Drop audit function
DROP FUNCTION IF EXISTS audit_trigger_function();

-- Drop audit table
DROP TABLE IF EXISTS audit_logs;

COMMIT;
```

### Migration Best Practices

#### Pre-Migration Checklist
1. **Backup**: Create full backup before migration
2. **Test**: Run migration on staging environment
3. **Validate**: Verify data integrity after migration
4. **Document**: Update schema documentation

#### Migration Execution
```bash
# Apply migration
psql -h your-project.supabase.co -U postgres -d postgres -f migration_file.sql

# Verify migration
psql -h your-project.supabase.co -U postgres -d postgres -c "SELECT version();"
```

---

## Monitoring & Maintenance

### Performance Monitoring

#### Query Performance
```sql
-- Slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Table access patterns
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

#### Index Usage
```sql
-- Unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

### Maintenance Tasks

#### Regular Maintenance
```sql
-- Update table statistics
ANALYZE users;
ANALYZE teams;
ANALYZE releases;
ANALYZE features;

-- Vacuum tables
VACUUM ANALYZE users;
VACUUM ANALYZE teams;
VACUUM ANALYZE releases;
VACUUM ANALYZE features;
```

#### Cleanup Tasks
```sql
-- Clean old audit logs (keep 1 year)
DELETE FROM audit_logs 
WHERE timestamp < CURRENT_DATE - INTERVAL '1 year';

-- Archive completed releases older than 2 years
-- (Implementation depends on archiving strategy)
```

### Health Checks

#### Database Health Queries
```sql
-- Check for orphaned records
SELECT 'orphaned_features' as issue, COUNT(*) as count
FROM features f
LEFT JOIN releases r ON f.release_id = r.id
WHERE r.id IS NULL

UNION ALL

SELECT 'orphaned_team_users' as issue, COUNT(*) as count
FROM team_users tu
LEFT JOIN teams t ON tu.team_id = t.id
LEFT JOIN users u ON tu.user_id = u.id
WHERE t.id IS NULL OR u.id IS NULL

UNION ALL

SELECT 'orphaned_release_teams' as issue, COUNT(*) as count
FROM release_teams rt
LEFT JOIN releases r ON rt.release_id = r.id
LEFT JOIN teams t ON rt.team_id = t.id
WHERE r.id IS NULL OR t.id IS NULL;
```

#### Performance Health
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
```

---

*This database documentation provides a comprehensive overview of the Release Management Checklist App's data architecture. For implementation details, refer to the SQL migration files in the `/database/` directory.* 