# Requirement Analysis

## Selected Project Option

Project Tracker — A team project and task management application with authentication and authorization.

## My Understanding (in my own words)

Build a web application where teams can create projects, break them into tasks, track progress, and manage access through role-based permissions. The app needs a dashboard for quick status overview, full CRUD for projects and tasks, status workflows that enforce valid transitions, and an auth system that controls who can do what.

## Functional Requirements

### Core Application
1. Dashboard displaying project/task statistics (totals, active, completed, overdue, upcoming deadlines)
2. Project CRUD with name, description, status, priority, dates, progress
3. Task CRUD with title, description, status, priority, due date, assignee, linked to a project
4. Status workflow enforcement (Project: Planned→In Progress→Completed/On Hold/Cancelled; Task: Todo→In Progress→Review→Done)
5. Search and filtering by status, priority, due date across projects and tasks
6. Progress tracking (auto-calculated from task completion percentages)

### Authentication & Authorization
7. User registration with email/password (bcrypt hashing, cost factor 10)
8. Login via NextAuth.js credentials provider with JWT sessions
9. Three-tier RBAC: Admin (all access), Manager (all project/task access), Member (own resources only)
10. Route protection (middleware for pages, withAuth/withRole for APIs)
11. Admin user management (list users, change roles)

## Non-Functional Requirements

1. TypeScript strict mode throughout
2. All API inputs validated with Zod (strict schemas rejecting unknown fields)
3. Consistent error responses (error type, message, field errors)
4. Responsive UI (mobile-first with MUI breakpoints)
5. Sub-2-second dashboard API response time
6. Password never exposed in any API response
7. Authentication failure messages must be generic (no email/password enumeration)

## Assumptions

1. Single-tenant application (one team per deployment)
2. No email verification required for registration
3. No password reset flow needed
4. No social OAuth providers (credentials only)
5. Legacy data (projects/tasks without owner) accessible to all authenticated users
6. Admin must be promoted via database (no self-registration as Admin)

## Clarifications (questions for a product owner)

1. Should there be pagination on project/task lists? (Currently returns all)
2. Is email case-sensitive for login? (Implemented as case-sensitive)
3. Should session tokens have an expiry? (Using NextAuth.js defaults)
4. Should deleted projects cascade-delete tasks? (Yes, implemented)
5. Should there be audit logging for role changes? (Not implemented)

## Edge Cases

1. Creating a project with dueDate before startDate → ValidationError
2. Transitioning directly from "Planned" to "Completed" → TransitionError
3. Registering with an already-used email → 409 ConflictError
4. Admin trying to change their own role → 403 ForbiddenError
5. Member trying to update a project they don't own → 403 ForbiddenError
6. Null ownerId on legacy projects → accessible to all (backward compatibility)
7. Empty database → dashboard shows all zeros gracefully
8. Password at exactly 8 chars → accepted (boundary)
9. Password at exactly 128 chars → accepted (boundary)
10. Name that is only whitespace → rejected after trim
