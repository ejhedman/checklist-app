# Repository Pattern

This directory contains all database queries organized into repository classes following the repository pattern. Each repository is responsible for a specific domain and contains all related database operations.

## Structure

```
src/lib/repository/
├── auth/
│   └── repository.ts          # Authentication and user-related queries
├── home/
│   └── repository.ts          # Dashboard and milestone queries
├── members/
│   └── repository.ts          # Member management queries
├── projects/
│   └── repository.ts          # Project management queries
├── releases/
│   ├── repository.ts          # Release management queries
│   └── features-repository.ts # Feature management queries
├── releasenotes/
│   └── repository.ts          # Release notes queries
├── targets/
│   └── repository.ts          # Target management queries
├── teams/
│   └── repository.ts          # Team management queries
├── users/
│   └── repository.ts          # User management queries
└── index.ts                   # Exports all repositories and types
```

## Usage

### Importing Repositories

```typescript
import { 
  AuthRepository, 
  MembersRepository, 
  ProjectsRepository,
  ReleasesRepository,
  FeaturesRepository,
  TeamsRepository,
  TargetsRepository,
  HomeRepository,
  UsersRepository,
  ReleaseNotesRepository
} from '@/lib/repository';
```

### Using a Repository

```typescript
// Create an instance of the repository
const membersRepository = new MembersRepository();

// Use the repository methods
try {
  const members = await membersRepository.getMembers(projectId);
  console.log('Members:', members);
} catch (error) {
  console.error('Error fetching members:', error);
}
```

### Example: Updating a Member

```typescript
import { MembersRepository } from '@/lib/repository';

const membersRepository = new MembersRepository();

try {
  await membersRepository.updateMember(memberId, {
    full_name: 'New Name',
    email: 'newemail@example.com'
  });
  console.log('Member updated successfully');
} catch (error) {
  console.error('Error updating member:', error);
}
```

### Example: Creating a Release with Features

```typescript
import { ReleasesRepository, FeaturesRepository } from '@/lib/repository';

const releasesRepository = new ReleasesRepository();
const featuresRepository = new FeaturesRepository();

try {
  // Create the release
  const release = await releasesRepository.createRelease({
    name: 'Release 1.0',
    target_date: '2024-01-15',
    project_id: 'project-id',
    targets: ['target1', 'target2']
  });

  // Add features to the release
  await featuresRepository.createFeature({
    name: 'New Feature',
    description: 'Description of the feature',
    is_platform: true,
    is_config: false,
    release_id: release.id
  });

  console.log('Release and feature created successfully');
} catch (error) {
  console.error('Error creating release:', error);
}
```

## Repository Classes

### AuthRepository
- `getUserProjects(userId: string)` - Get projects for a user
- `getUserRole(userId: string)` - Get user's system role
- `getCurrentMemberInfo()` - Get current user's member info
- `getMemberByEmail(email: string)` - Get member by email

### MembersRepository
- `getMembers(projectId: string)` - Get all members for a project
- `getMembersByProject(projectId: string)` - Get members with basic info
- `getMembersForTeamAssignment(projectId: string)` - Get members for team assignment
- `getMembersForFeatureDRI(projectId: string)` - Get members for feature DRI
- `createMember(memberData)` - Create a new member
- `updateMember(memberId, updateData)` - Update a member
- `deleteMember(memberId)` - Delete a member

### ProjectsRepository
- `getProjects()` - Get all projects
- `createProject(projectData)` - Create a new project
- `updateProject(projectId, updateData)` - Update a project
- `deleteProject(projectId)` - Delete a project
- `checkProjectNameUniqueness(name, excludeId?)` - Check project name uniqueness

### TeamsRepository
- `getTeams(projectId: string)` - Get all teams for a project
- `createTeam(teamData)` - Create a new team
- `updateTeam(teamId, updateData)` - Update a team
- `deleteTeam(teamId)` - Delete a team
- `getTeamMembers(teamId: string)` - Get team members
- `addMembersToTeam(teamId, memberIds, projectId)` - Add members to team
- `removeMembersFromTeam(teamId, memberIds)` - Remove members from team

### ReleasesRepository
- `getReleases(projectId, options)` - Get releases with optional details
- `getReleaseByName(name, projectId)` - Get release by name and project
- `getReleaseById(releaseId)` - Get release by ID
- `createRelease(releaseData)` - Create a new release
- `updateRelease(releaseId, updateData)` - Update a release
- `deleteRelease(releaseId)` - Delete a release
- `getReleaseTeams(releaseId)` - Get teams for a release
- `addTeamsToRelease(releaseId, teamIds)` - Add teams to release
- `removeTeamsFromRelease(releaseId, teamIds)` - Remove teams from release
- `updateMemberReleaseState(memberId, releaseId, isReady)` - Update member ready state
- `logActivity(activityData)` - Log activity

### FeaturesRepository
- `createFeature(featureData)` - Create a new feature
- `updateFeature(featureId, updateData)` - Update a feature
- `deleteFeature(featureId)` - Delete a feature
- `getFeaturesForRelease(releaseId)` - Get features for a release
- `getFeaturesByDRI(memberId, projectIds)` - Get features where user is DRI
- `logFeatureActivity(activityData)` - Log feature activity

### TargetsRepository
- `getTargets(projectId: string)` - Get all targets for a project
- `createTarget(targetData)` - Create a new target
- `updateTarget(targetId, updateData)` - Update a target
- `deleteTarget(targetId)` - Delete a target
- `checkTargetNameUniqueness(name, projectId, excludeId?)` - Check target name uniqueness
- `checkTargetShortNameUniqueness(shortName, projectId, excludeId?)` - Check target short name uniqueness

### HomeRepository
- `getDashboardData(projectIds: string[])` - Get dashboard data
- `getUserMilestones(projectIds: string[], userEmail: string)` - Get user milestones

### UsersRepository
- `getUsers()` - Get all users with roles and project counts
- `getUserById(userId)` - Get user by ID
- `createUser(userData)` - Create a new user
- `updateUser(userId, updateData)` - Update a user
- `deleteUser(userId)` - Delete a user
- `searchAuthUsers(email?, projectId?)` - Search auth users

### ReleaseNotesRepository
- `getReleasesForNotes()` - Get all releases for release notes
- `getReleaseBySlug(slug: string)` - Get release by slug for release notes

## Benefits

1. **Separation of Concerns**: Database queries are separated from business logic
2. **Reusability**: Repository methods can be reused across different components
3. **Testability**: Easy to mock repository methods for testing
4. **Maintainability**: Changes to database queries are centralized
5. **Type Safety**: Full TypeScript support with proper interfaces
6. **Error Handling**: Consistent error handling across all repositories

## Migration Guide

To migrate existing code to use repositories:

1. Replace direct Supabase calls with repository method calls
2. Update imports to use repository classes
3. Remove duplicate query logic
4. Update error handling to use repository error patterns

Example migration:

```typescript
// Before
const { data, error } = await supabase
  .from("members")
  .select("*")
  .eq("project_id", projectId);

// After
const membersRepository = new MembersRepository();
const members = await membersRepository.getMembers(projectId);
``` 