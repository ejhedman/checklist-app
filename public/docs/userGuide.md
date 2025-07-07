# User Guide - Release Management Checklist App

## Table of Contents

1. [App Purpose & Overview](#app-purpose--overview)
2. [Getting Started](#getting-started)
3. [Authentication & User Management](#authentication--user-management)
4. [Dashboard Overview](#dashboard-overview)
5. [Multi-Tenancy](#multi-tenancy)
6. [Team Management](#team-management)
7. [Release Management](#release-management)
8. [Feature Tracking](#feature-tracking)
9. [Readiness Monitoring](#readiness-monitoring)
10. [Calendar View](#calendar-view)
11. [Target Management](#target-management)
12. [Member Management](#member-management)
13. [Release Notes](#release-notes)
14. [Best Practices](#best-practices)
15. [Troubleshooting](#troubleshooting)

---

## App Purpose & Overview

### What is the Release Management Checklist App?

The Release Management Checklist App is a comprehensive web application designed to help engineering teams plan, track, and complete software releases efficiently. It maintains a structured checklist that captures **who** must do **what** by **when**, providing a continuous timeline of past and future releases while always surfacing the *next* scheduled release that requires attention.

### Key Benefits

- **Clear Accountability**: Every feature has a Directly Responsible Individual (DRI)
- **Real-Time Status**: Automatic calculation of release readiness based on team and feature completion
- **Visual Planning**: Calendar view for release scheduling and drag-and-drop date management
- **Multi-Tenant**: Support for multiple organizations with complete data isolation
- **Comprehensive Tracking**: From initial planning through deployment completion
- **Audit Trail**: Complete history of all changes and activities

### Core Features

- **Release Management**: Create, track, and manage software releases with automatic state transitions
- **Team Collaboration**: Organize teams and assign members to releases
- **Feature Tracking**: Attach key features to releases with designated DRIs
- **Readiness Monitoring**: Track individual and team readiness with automatic release state calculation
- **Calendar Planning**: Visual calendar interface with drag-and-drop release scheduling
- **Target Management**: Manage deployment targets and environments
- **Release Notes**: Generate and manage release documentation
- **Activity Logging**: Comprehensive audit trail of all system activities

---

## Getting Started

### First-Time Setup

1. **Access the Application**
   - Navigate to your Release Management Checklist App URL
   - You'll be redirected to the login page if not authenticated

2. **Authentication**
   - Click "Sign In" in the top-right corner
   - Choose your authentication method:
     - **Email/Password**: Enter your credentials
     - **GitHub OAuth**: Click "Sign in with GitHub"
   - Complete the authentication process

3. **Profile Setup** (First-time users)
   - Enter your full name and optional nickname
   - Review and accept the terms of service
   - Complete your profile setup

### Navigation

The app features a clean, intuitive interface with the following main sections:

- **Dashboard** (`/`): Overview of all activities and upcoming releases
- **Teams** (`/teams`): Manage teams and team members
- **Releases** (`/releases`): View and manage all releases
- **Calendar** (`/calendar`): Visual calendar view with drag-and-drop scheduling
- **Targets** (`/targets`): Manage deployment targets and environments
- **Members** (`/members`): Manage team members and user accounts
- **Release Notes** (`/releasenotes`): Generate and manage release documentation
- **Tenants** (`/tenants`): Manage organization settings (Admin only)

---

## Authentication & User Management

### User Roles

The app supports multiple user roles with different permission levels:

#### System Roles (Global)
- **Admin**: Full system access across all tenants
- **User**: Standard user access within assigned tenants

#### Tenant Roles (Per Organization)
- **Admin**: Full access within the tenant organization
- **Release Manager**: Release lifecycle management within the tenant
- **Member**: Standard team member access within the tenant

### Profile Management

1. **Update Profile**
   - Click your profile icon in the header
   - Select "Profile" to edit your information
   - Update your full name, nickname, or email
   - Save changes

2. **Change Password** (Email/Password users)
   - Go to Profile settings
   - Click "Change Password"
   - Enter current and new passwords
   - Confirm the change

---

## Dashboard Overview

The Dashboard provides a comprehensive overview of your release management activities within your organization.

### Key Metrics Cards

The dashboard displays several metric cards:

1. **Total Releases**: Count of all active releases in your organization
2. **Active Teams**: Number of teams with active releases
3. **Ready Releases**: Releases that meet all readiness criteria
4. **Past Due**: Releases that are overdue and require attention

### Upcoming Releases

This section highlights the next few releases that need attention:
- Release name and target date
- Days remaining until target
- Current status (Pending, Ready, etc.)
- Quick access to release details

### My Upcoming Milestones

Shows releases where you are personally involved:
- Releases where you're a team member
- Your personal readiness status
- Quick access to mark yourself as ready

### Recent Activity

Shows the latest updates across all releases in your organization:
- Feature status changes
- Release completions
- Team additions
- User readiness updates
- Release note publications

---

## Multi-Tenancy

### Organization Isolation

The app supports multiple organizations (tenants) with complete data isolation:

- **Separate Data**: Each organization's data is completely isolated
- **User Assignment**: Users can belong to multiple organizations with different roles
- **Security**: Row-Level Security ensures users can only access their assigned organizations
- **Independent Management**: Each organization manages its own teams, releases, and members

### Switching Organizations

If you belong to multiple organizations:
- Your current organization is displayed in the header
- Contact your administrator to switch between organizations
- All data and permissions are scoped to your current organization

---

## Team Management

### Creating a Team

1. **Navigate to Teams**
   - Click "Teams" in the sidebar
   - Click the "Add Team" button

2. **Fill Team Information**
   - **Name**: Enter a descriptive team name (e.g., "Frontend Team")
   - **Description**: Provide a brief description of the team's responsibilities
   - Click "Create Team"

### Managing Team Members

1. **Add Members**
   - Open the team card
   - Click "Add Member"
   - Search for members by name or email
   - Select members to add to the team

2. **Remove Members**
   - Open the team card
   - Find the member in the list
   - Click the remove icon (🗑️)
   - Confirm the removal

### Team Information

Each team card displays:
- Team name and description
- Number of members
- Number of active releases
- Quick action buttons (Edit, Delete)

---

## Release Management

### Creating a Release

1. **Navigate to Releases**
   - Click "Releases" in the sidebar
   - Click "Create Release"

2. **Fill Release Details**
   - **Name**: Descriptive release name (e.g., "v2.1.0 - Feature Release")
   - **Target Date**: When the release should be deployed
   - **Platform Update**: Check if this release includes platform updates
   - **Config Update**: Check if this release includes configuration changes
   - **Assigned Teams**: Select teams responsible for this release
   - **Release Notes**: Optional initial release notes
   - **Release Summary**: Brief summary of the release

3. **Save Release**
   - Review all information
   - Click "Create Release"

### Release States

Releases automatically transition through states based on criteria:

#### Pending
- **Definition**: Release with target date ≥ today AND not ready/complete/cancelled
- **Color**: Yellow
- **Action Required**: Teams need to complete their tasks

#### Ready
- **Definition**: Pending release AND all readiness criteria met
- **Color**: Green
- **Action Required**: Ready for deployment

#### Past Due
- **Definition**: Pending release AND target date < today AND not ready
- **Color**: Red
- **Action Required**: Immediate attention required

#### Complete
- **Definition**: Manually set by release manager when deployed
- **Color**: Blue
- **Action Required**: None (archived)

#### Cancelled
- **Definition**: Manually set by release manager
- **Color**: Gray
- **Action Required**: None (archived)

### Managing Releases

1. **Edit Release**
   - Click the edit icon (✏️) on a release card
   - Modify release details
   - Save changes

2. **Cancel Release**
   - Click the cancel button on a release card
   - Confirm cancellation
   - Release will be marked as cancelled

3. **Mark Complete**
   - Click "Mark Complete" when release is deployed
   - Release will be archived

4. **Archive/Unarchive**
   - Toggle the "Show archived" checkbox to view archived releases
   - Archived releases can be unarchived if needed

---

## Feature Tracking

### Adding Features to Releases

1. **Access Release Details**
   - Click on a release card to open details
   - Navigate to the "Features" tab

2. **Add Feature**
   - Click "Add Feature"
   - Fill in feature details:
     - **Name**: Feature name
     - **JIRA Ticket**: Associated JIRA ticket number
     - **Description**: Detailed description
     - **DRI**: Directly Responsible Individual
     - **Platform Feature**: Check if this is a platform-level feature
     - **Config Feature**: Check if this is a configuration feature
     - **Comments**: Additional notes or context

3. **Save Feature**
   - Review information
   - Click "Add Feature"

### Managing Features

1. **Mark Feature Ready**
   - Find the feature in the list
   - Click the checkbox to mark as ready
   - Only the DRI can mark features as ready

2. **Edit Feature**
   - Click the edit icon on a feature
   - Update details
   - Save changes

3. **Remove Feature**
   - Click the delete icon on a feature
   - Confirm deletion

### Feature Status

Features have two states:
- **Not Ready** (default): Feature is still in development
- **Ready**: Feature is complete and ready for release

---

## Readiness Monitoring

### Individual Readiness

1. **Mark Personal Readiness**
   - Navigate to a release's "Team Readiness" tab
   - Find your name in the team list
   - Click the checkbox to mark yourself as ready

2. **Update Readiness Status**
   - You can toggle your readiness status at any time
   - Changes are immediately reflected in release calculations

### Team Readiness

The app automatically calculates team readiness based on:
- All team members marked as ready
- All assigned features marked as ready

### Release Readiness

A release becomes "Ready" when:
- All assigned teams have all members marked as ready
- All features are marked as ready

### Readiness Dashboard

The readiness tab shows:
- List of all team members
- Individual readiness status
- Team readiness percentage
- Overall release readiness

---

## Calendar View

The Calendar provides a visual overview of all releases and their target dates across two months.

### Calendar Features

1. **Two-Month View**
   - Current month and next month displayed side by side
   - Traditional calendar layout with days as columns and weeks as rows
   - Past days are automatically greyed out

2. **Release Visualization**
   - Each release appears on its target date
   - Releases are color-coded by their state:
     - **Green**: Ready releases
     - **Yellow**: Pending releases
     - **Red**: Past due releases
     - **Blue**: Complete releases
     - **Gray**: Cancelled releases

3. **Drag and Drop Functionality**
   - **Moving Releases**: Click and drag any release to a new date
   - **Visual Feedback**: 
     - Valid drop zones (future dates) show green highlighting
     - Invalid drop zones (past dates) show red highlighting
     - Dragged release becomes semi-transparent
   - **Date Validation**: Releases cannot be dropped on dates in the past
   - **Automatic Updates**: Release dates are automatically updated in the database when dropped

### Using the Calendar

1. **Navigate to Calendar**
   - Click "Calendar" in the sidebar
   - View current and next month releases

2. **Move a Release**
   - Click and hold on any release name
   - Drag to the desired future date
   - Release the mouse to drop the release
   - The release date will be automatically updated

3. **View Release Details**
   - Click on any day with a release to view release details
   - Navigate to the release management page for full editing options

### Calendar Best Practices

1. **Regular Review**
   - Check the calendar weekly to review upcoming releases
   - Identify potential conflicts or scheduling issues
   - Plan team capacity based on release dates

2. **Date Management**
   - Use drag-and-drop to quickly adjust release schedules
   - Consider team availability when moving releases
   - Communicate date changes to affected teams

3. **Visual Planning**
   - Use the calendar to identify busy periods
   - Plan releases to avoid overlapping high-priority items
   - Balance workload across teams and time periods

---

## Target Management

### What are Targets?

Targets represent deployment environments or destinations for your releases (e.g., Production, Staging, Development).

### Creating a Target

1. **Navigate to Targets**
   - Click "Targets" in the sidebar
   - Click "Add Target"

2. **Fill Target Information**
   - **Short Name**: Brief identifier (e.g., "prod", "staging")
   - **Name**: Full target name (e.g., "Production Environment")
   - **Is Live**: Check if this is a live/production environment
   - Click "Create Target"

### Managing Targets

1. **Edit Target**
   - Click the edit icon on a target card
   - Modify target details
   - Save changes

2. **Delete Target**
   - Click the delete icon on a target card
   - Confirm deletion

### Target Assignment

When creating or editing releases, you can assign multiple targets:
- Select from available targets in your organization
- Targets help track which environments the release will be deployed to
- This information is stored in the release's targets array

---

## Member Management

### What are Members?

Members are users within your organization who can participate in releases and teams.

### Managing Members

1. **Navigate to Members**
   - Click "Members" in the sidebar
   - View all members in your organization

2. **Add Member**
   - Click "Add Member"
   - Search for users by email
   - Assign appropriate role and tenant
   - Click "Add Member"

3. **Edit Member**
   - Click the edit icon on a member card
   - Update member information
   - Save changes

4. **Update Password**
   - Click the password icon on a member card
   - Enter new password
   - Confirm the change

### Member Roles

Within your organization, members can have different roles:
- **Admin**: Full access within the organization
- **Release Manager**: Can manage releases and teams
- **Member**: Standard team member access

---

## Release Notes

### What are Release Notes?

Release Notes provide documentation for each release, including features, changes, and deployment information.

### Creating Release Notes

1. **Navigate to Release Notes**
   - Click "Release Notes" in the sidebar
   - Click "Create Release Note"

2. **Fill Release Note Details**
   - **Title**: Release note title
   - **Release**: Select the associated release
   - **Content**: Detailed release notes content
   - **Summary**: Brief summary of the release
   - Click "Create Release Note"

### Managing Release Notes

1. **Edit Release Notes**
   - Click the edit icon on a release note
   - Update content and details
   - Save changes

2. **View Release Notes**
   - Click on a release note to view full details
   - Release notes are publicly accessible

### Release Notes Best Practices

1. **Clear Structure**
   - Use consistent formatting
   - Include feature descriptions
   - List breaking changes
   - Provide migration instructions if needed

2. **Timely Publication**
   - Publish release notes before deployment
   - Update notes after deployment if needed
   - Keep notes current with release changes

---

## Best Practices

### Release Planning

1. **Set Realistic Target Dates**
   - Consider team capacity and complexity
   - Allow buffer time for unexpected issues
   - Coordinate with other teams

2. **Clear Feature Descriptions**
   - Provide detailed descriptions for each feature
   - Include acceptance criteria
   - Link to relevant documentation

3. **Assign Appropriate DRIs**
   - Choose team members with relevant expertise
   - Ensure DRIs have time to complete tasks
   - Consider backup DRIs for critical features

### Team Management

1. **Keep Teams Focused**
   - Limit team size to manageable numbers
   - Ensure clear responsibilities
   - Regular team communication

2. **Regular Status Updates**
   - Update readiness status regularly
   - Communicate blockers early
   - Keep feature descriptions current

### Communication

1. **Use the Activity Feed**
   - Monitor recent activity for updates
   - Stay informed about release progress
   - Respond to readiness requests promptly

2. **Escalate Issues Early**
   - Mark releases as past due when needed
   - Communicate with release managers about blockers
   - Update feature status when issues arise

### Calendar Management

1. **Regular Review**
   - Check the calendar weekly to review upcoming releases
   - Identify potential conflicts or scheduling issues
   - Plan team capacity based on release dates

2. **Date Management**
   - Use drag-and-drop to quickly adjust release schedules
   - Consider team availability when moving releases
   - Communicate date changes to affected teams

---

## Troubleshooting

### Common Issues

#### Can't Access a Release
- **Cause**: You may not be assigned to any team involved in the release
- **Solution**: Contact your administrator to be added to the appropriate team

#### Can't Mark Feature Ready
- **Cause**: You may not be the DRI for the feature
- **Solution**: Contact the release manager to update the DRI assignment

#### Release Not Showing as Ready
- **Cause**: Not all team members or features are marked as ready
- **Solution**: Check the readiness tab to identify missing items

#### Authentication Issues
- **Cause**: Session may have expired or credentials are incorrect
- **Solution**: Sign out and sign back in, or reset your password

#### Can't See Your Organization's Data
- **Cause**: You may not be properly assigned to the organization
- **Solution**: Contact your administrator to verify your tenant assignment

### Getting Help

1. **Check the Activity Feed**
   - Look for recent changes that might explain issues
   - Verify your permissions and assignments

2. **Contact Your Administrator**
   - For permission issues
   - For team assignment problems
   - For system configuration questions
   - For organization/tenant issues

3. **Review Release Details**
   - Check all tabs in release details
   - Verify readiness criteria are met
   - Review feature and team assignments

### Keyboard Shortcuts

- **Ctrl/Cmd + K**: Quick search
- **Escape**: Close modals and dialogs
- **Tab**: Navigate between form fields
- **Enter**: Submit forms and confirm actions

---

## Advanced Features

### Real-Time Updates

The app provides real-time updates for:
- Release status changes
- Feature readiness updates
- Team member status changes
- New activity notifications

### Activity Logging

All system activities are automatically logged:
- Release creation and updates
- Feature status changes
- Team member changes
- User readiness updates
- Release note publications

### Multi-Tenant Security

- **Complete Data Isolation**: Each organization's data is completely separate
- **Role-Based Access**: Different permissions for different user roles
- **Row-Level Security**: Database-level security ensures data protection
- **Audit Trail**: Complete history of all changes and activities

### Integration Features

- **JIRA Integration**: Link features to JIRA tickets
- **GitHub Integration**: Planned for future releases
- **Slack Notifications**: Planned for future releases
- **Email Alerts**: Planned for future releases

---

*This user guide covers the core functionality of the Release Management Checklist App. For technical documentation, please refer to the [Requirements Document](./requirements.md) and [Database Documentation](./database.md).* 