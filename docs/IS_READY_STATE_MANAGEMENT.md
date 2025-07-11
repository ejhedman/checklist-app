# Is Ready State Management

This document describes the management of the `is_ready` state in the release system, including features, team members, and overall release readiness.

## Overview

The system manages readiness states at multiple levels:
- **Individual Features**: Each feature has an `is_ready` field that can be toggled by the DRI or release manager
- **Individual Team Members**: Each team member has an `is_ready` state tracked in `member_release_state` table
- **Overall Release**: The release has an `is_ready` field that is automatically calculated based on all features and members being ready

## Components Involved

### ReleaseSummaryCard
- **Location**: `src/components/releases/ReleaseSummaryCard.tsx`
- **Purpose**: Main release card that displays release information and manages overall ready state
- **Key Functions**:
  - `updateReleaseReadyState()`: Centralized function that calculates and updates release ready state
  - `getCurrentReleaseReadyState()`: Calculates ready state from current local state for immediate UI updates
  - `handleFeatureReadyChange()`: Handles individual feature ready state changes
  - `updateMemberReady()`: Handles individual member ready state changes

### FeaturesCard
- **Location**: `src/components/releases/FeaturesCard.tsx`
- **Purpose**: Displays and manages feature readiness
- **Key Functions**:
  - Calculates internal `isReady` state based on all features being ready
  - Reports state changes to parent via `onFeaturesReadyStateChange` callback
  - Reports initial state immediately upon mounting

### TeamMembersCard
- **Location**: `src/components/releases/TeamMembersCard.tsx`
- **Purpose**: Displays and manages team member readiness
- **Key Functions**:
  - Calculates internal `isReady` state based on all members being ready
  - Reports state changes to parent via `onTeamsReadyStateChange` callback
  - Reports initial state immediately upon mounting

### FeatureCard
- **Location**: `src/components/releases/FeatureCard.tsx`
- **Purpose**: Individual feature card with ready checkbox
- **Key Functions**:
  - Allows DRI or release manager to toggle feature ready state
  - Updates local state immediately for responsive UI

## State Management Flow

### 1. Initialization
- When `ReleaseSummaryCard` expands, it loads detailed release data
- Child components (`FeaturesCard`, `TeamMembersCard`) report their initial ready states immediately
- Parent calculates overall release ready state and updates database if needed

### 2. Individual State Changes
- When a feature or member ready state is toggled:
  1. Local state is updated immediately for responsive UI
  2. Database is updated with the new state
  3. Summary counts are recalculated
  4. `updateReleaseReadyState()` is called to recalculate overall release state
  5. Database is updated with new release ready state

### 3. Release Ready State Calculation
The release is considered ready when:
- **AND** operation: Both features AND team members must be ready
- Features ready: `features.length > 0 && features.every(f => f.is_ready)`
- Members ready: `members.length > 0 && members.every(m => m.is_ready)`
- Overall ready: `allFeaturesReady && allMembersReady`

## Database Schema

### Features Table
```sql
CREATE TABLE features (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_ready BOOLEAN DEFAULT FALSE,
  dri_member_id UUID REFERENCES members(id),
  -- other fields...
);
```

### Member Release State Table
```sql
CREATE TABLE member_release_state (
  release_id UUID REFERENCES releases(id),
  member_id UUID REFERENCES members(id),
  project_id UUID REFERENCES projects(id),
  is_ready BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (release_id, member_id)
);
```

### Releases Table
```sql
CREATE TABLE releases (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  -- other fields...
);
```

## Key Fixes Implemented

### 1. Centralized State Calculation
- **Problem**: Multiple components were calculating release ready state independently
- **Solution**: Single `updateReleaseReadyState()` function that uses current local state
- **Benefit**: Consistent state calculation and immediate UI updates

### 2. Immediate State Reporting
- **Problem**: Child components didn't report initial state immediately
- **Solution**: Added `hasReportedInitialState` tracking and immediate state reporting
- **Benefit**: No initialization race conditions

### 3. Single Database Update Point
- **Problem**: Multiple functions were updating the release `is_ready` field
- **Solution**: Only `updateReleaseReadyState()` updates the database
- **Benefit**: Eliminates race conditions and duplicate updates

### 4. Local State Synchronization
- **Problem**: Badge was reading from stale local state
- **Solution**: `getCurrentReleaseReadyState()` calculates from current local arrays
- **Benefit**: Badge updates immediately when individual checkboxes are toggled

### 5. Header Icons Behavior
- **Problem**: Icons were hidden based on release state conditions
- **Solution**: Most icons are always shown but disabled when not applicable, except archive checkbox which is hidden when not applicable
- **Benefit**: Consistent UI layout and better user experience
- **Implementation**:
  - **Archive checkbox**: Only visible when release is `past_due` or `cancelled`
  - **Deploy button**: Always visible, disabled unless release is ready and not deployed
  - **Cancel button**: Always visible, disabled if release is deployed
  - **Edit button**: Always visible, disabled unless release is `pending` or `next`
  - **Delete button**: Always visible for release managers

## Visual Indicators

### Badge Colors
- **Green**: Release is ready (all features and members ready)
- **Red**: Not ready and less than 3 days until release
- **Amber**: Not ready and 3+ days until release

### Icon States
- **Enabled**: Normal colors and hover effects
- **Disabled**: Gray colors, reduced opacity, `cursor-not-allowed`

### Donut Charts
- **Features**: Shows ready/total features with color coding
- **Teams**: Shows ready/total members with color coding
- **Deployment**: Shows deployment status

## Activity Logging

All ready state changes are logged to the `activity_log` table with:
- `activity_type`: "release_ready_change"
- `activity_details`: Contains old/new states and reasoning
- Automatic logging for both feature and member state changes

## Testing Considerations

1. **Initial Load**: Verify child components report initial state correctly
2. **Individual Toggles**: Test feature and member ready state changes
3. **Overall State**: Verify release ready state updates correctly
4. **Database Consistency**: Ensure local and database states stay synchronized
5. **UI Responsiveness**: Confirm badge and donut charts update immediately
6. **Icon States**: Verify icons show as disabled when appropriate 