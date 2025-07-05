# Release Management Checklist App

## Overview

The Release Management Checklist App is a comprehensive web application designed to help engineering teams plan, track, and complete software releases efficiently. It maintains a structured checklist that captures **who** must do **what** by **when**, providing a continuous timeline of past and future releases while always surfacing the *next* scheduled release that requires attention.

## Key Features

- **Release Management**: Create, track, and manage software releases with automatic state transitions
- **Team Collaboration**: Organize teams and assign members to releases
- **Feature Tracking**: Attach key features to releases with designated DRIs (Directly Responsible Individuals)
- **Readiness Monitoring**: Track individual and team readiness with automatic release state calculation
- **Role-Based Access**: Secure access control with different permissions for different user roles
- **Real-Time Updates**: Live status updates and progress tracking

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **Deployment**: Vercel (frontend), Supabase (backend services)

## Documentation

### 📖 [User Guide](./userGuide.md)
Comprehensive guide for all users covering:
- Getting started and onboarding
- Creating and managing releases
- Team and user management
- Feature tracking and readiness monitoring
- Best practices and tips

### 📋 [Requirements Document](./requirements.md)
Detailed system requirements including:
- Functional and non-functional requirements
- User roles and permissions
- Business rules and state logic
- API specifications
- UI/UX guidelines

### 🗄️ [Database Documentation](./database.md)
Complete database design documentation:
- Table schemas and relationships
- Row-Level Security (RLS) policies
- Data constraints and validation rules
- Audit trails and logging

## Quick Start

1. **Environment Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

2. **Database Setup**
   - Run the SQL schema in your Supabase project
   - Configure authentication providers
   - Set up RLS policies

3. **Development**
   ```bash
   npm run dev
   # App will be available at http://localhost:3000
   ```

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Administrator** | System-wide management | Full access to all features |
| **Release Manager** | Release lifecycle management | Create/edit/cancel releases, manage teams |
| **Developer/Config Engineer** | Feature implementation | Mark features as ready, update status |
| **Team Member** | Individual readiness tracking | Mark personal readiness for releases |

## Release States

- **Pending**: Upcoming release that needs attention
- **Ready**: All criteria met, ready for deployment
- **Past Due**: Overdue release requiring immediate attention
- **Complete**: Successfully deployed release
- **Cancelled**: Cancelled release

## Support

For technical support or feature requests, please refer to the [User Guide](./userGuide.md) or contact the development team.

## License

© 2024 Release Manager. All rights reserved. 