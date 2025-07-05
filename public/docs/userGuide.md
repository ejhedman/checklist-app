# User Guide - Release Management Checklist App

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication & User Management](#authentication--user-management)
3. [Dashboard Overview](#dashboard-overview)
4. [Team Management](#team-management)
5. [Release Management](#release-management)
6. [Feature Tracking](#feature-tracking)
7. [Readiness Monitoring](#readiness-monitoring)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

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

The app features a clean, intuitive interface with three main sections:

- **Dashboard** (`/`): Overview of all activities and next release
- **Teams** (`/teams`): Manage teams and team members
- **Releases** (`/releases`): View and manage all releases

---

## Authentication & User Management

### User Roles

The app supports four distinct user roles, each with specific permissions:

#### Administrator
- **Full system access**
- Can create, edit, and delete users
- Can manage all teams and releases
- Can configure system settings
- Can view audit logs

#### Release Manager
- **Release lifecycle management**
- Can create, edit, and cancel releases
- Can assign teams to releases
- Can manage team memberships
- Can mark releases as complete

#### Developer/Specs Engineer
- **Feature implementation**
- Can mark assigned features as ready
- Can update feature descriptions and JIRA tickets
- Can view release progress
- Can mark personal readiness

#### Team Member
- **Individual readiness tracking**
- Can mark personal readiness for releases
- Can view assigned releases and features
- Can update profile information

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

The Dashboard provides a comprehensive overview of your release management activities.

### Key Metrics

The dashboard displays four main metric cards:

1. **Total Releases**: Count of all releases in the system
2. **Active Teams**: Number of teams with active releases
3. **Ready Releases**: Releases that meet all readiness criteria
4. **Past Due**: Releases that are overdue and require attention

### Next Release Section

This section highlights the upcoming release that needs attention:
- Release name and target date
- Days remaining until target
- Current status (Pending, Ready, etc.)
- Quick access to release details

### Recent Activity

Shows the latest updates across all releases:
- Feature status changes
- Release completions
- Team additions
- User readiness updates

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
   - Search for users by name or email
   - Select users to add to the team

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
   - **Specs Update**: Check if this release includes configuration changes
   - **Assigned Teams**: Select teams responsible for this release

3. **Save Release**
   - Review all information
   - Click "Create Release"

### Release States

Releases automatically transition through states based on criteria:

#### Pending
- **Definition**: Earliest release with target date ≥ today AND not ready/complete/cancelled
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

### Getting Help

1. **Check the Activity Feed**
   - Look for recent changes that might explain issues
   - Verify your permissions and assignments

2. **Contact Your Administrator**
   - For permission issues
   - For team assignment problems
   - For system configuration questions

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

### Export and Reporting

- Export release data to CSV
- Generate readiness reports
- Track historical release performance
- Monitor team productivity metrics

### Integration Features

- JIRA ticket linking
- GitHub integration (planned)
- Slack notifications (planned)
- Email alerts (planned)

---

*This user guide covers the core functionality of the Release Management Checklist App. For technical documentation, please refer to the [Requirements Document](./requirements.md) and [Database Documentation](./database.md).* 