# Implementation Plan: Auth System

## Overview

Add authentication and role-based access control to the Project Tracker using NextAuth.js (Auth.js v5) with credentials provider, JWT sessions, and a three-tier role system (Admin, Manager, Member). Implementation follows a bottom-up approach: dependencies → schema → repository → services → auth config → middleware → API routes → frontend.

## Tasks

- [x] 1. Install dependencies and set up type augmentation
  - [x] 1.1 Install auth dependencies and create type augmentation file
    - Run `npm install next-auth@5 bcryptjs` and `npm install -D @types/bcryptjs`
    - Create `types/next-auth.d.ts` with Session and JWT type augmentations adding `id` and `role` fields
    - Add `AUTH_SECRET` and `NEXTAUTH_URL` entries to `.env.local`
    - _Requirements: 2.4, 3.4_

  - [x] 1.2 Add new error classes to lib/errors.ts
    - Add `ForbiddenError` class (status 403) to `lib/errors.ts`
    - Add `UnauthorizedError` class (status 401) to `lib/errors.ts`
    - Update `withErrorHandling` in `lib/api-handler.ts` to handle the new error types in responses
    - _Requirements: 4.1, 6.5, 6.6_

- [x] 2. Database schema migration
  - [x] 2.1 Update Prisma schema with User model and relations
    - Add `Role` enum (Admin, Manager, Member) to `prisma/schema.prisma`
    - Add `User` model with id, email (unique), name, hashedPassword, role (default Member), createdAt, updatedAt
    - Add optional `ownerId` field to Project model with relation to User (onDelete: SetNull)
    - Add optional `createdById` field to Task model with relation to User (onDelete: SetNull)
    - Add indexes on `ownerId` and `createdById`
    - Run `npx prisma migrate dev --name add_auth_tables` to generate and apply migration
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 3. Repository and validators
  - [x] 3.1 Create user repository
    - Create `repositories/user.repository.ts` with `UserRepository` class
    - Implement methods: `findByEmail`, `findById`, `create`, `updateName`, `updateRole`, `findAll`
    - Ensure `hashedPassword` is excluded from read queries (use Prisma select)
    - Export singleton `userRepository` instance
    - _Requirements: 8.1, 10.4_

  - [x] 3.2 Create auth validators
    - Create `validators/auth.validator.ts` with Zod schemas
    - Implement `registerSchema` (email, password 8-128 chars, name 1-100 chars) with `.strict()`
    - Implement `loginSchema`, `updateProfileSchema`, and `changeRoleSchema`
    - Export inferred TypeScript types
    - _Requirements: 1.4, 1.5, 1.6, 7.3, 10.6_

- [x] 4. Services layer
  - [x] 4.1 Create auth service
    - Create `services/auth.service.ts` with `AuthService` class
    - Implement `register` method: validate input with `registerSchema`, check duplicate email (throw ConflictError), hash password with bcrypt cost 10, create user with Member role, return user without password
    - Export singleton `authService` instance
    - _Requirements: 1.1, 1.2, 1.3, 10.1_

  - [x] 4.2 Write property tests for registration logic
    - **Property 1: Registration assigns Member role**
    - **Property 2: Password hashing integrity**
    - **Property 3: Duplicate email rejection**
    - **Property 4: Registration input validation**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 10.1, 10.6**

  - [x] 4.3 Create user service
    - Create `services/user.service.ts` with `UserService` class
    - Implement `getProfile` (returns id, email, name, role)
    - Implement `updateProfile` (updates only name, ignores email/role)
    - Implement `listUsers` (returns all users for admin)
    - Implement `changeRole` (rejects self-role-change with ForbiddenError)
    - Export singleton `userService` instance
    - _Requirements: 7.1, 7.2, 7.4, 11.1, 11.2, 11.3_

  - [x] 4.4 Write property tests for user service
    - **Property 11: Profile update immutability of protected fields**
    - **Property 12: Admin self-role-change prevention**
    - **Validates: Requirements 7.4, 11.3**

- [x] 5. Checkpoint - Core backend logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. NextAuth.js configuration and auth helpers
  - [x] 6.1 Create NextAuth.js configuration
    - Create `lib/auth.ts` with NextAuth configuration
    - Configure Credentials provider with email/password authentication
    - Set JWT session strategy
    - Configure `jwt` callback to embed id and role in token
    - Configure `session` callback to expose id and role on session.user
    - Set custom sign-in page to `/login`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.4_

  - [x] 6.2 Create auth helpers (withAuth, withRole)
    - Create `lib/auth-helpers.ts` with `AuthenticatedRequest` interface extending NextRequest
    - Implement `withAuth` HOF: extracts session via `auth()`, returns 401 if missing, injects user context
    - Implement `withRole(...roles)` HOF: checks user role, returns 403 if insufficient
    - Ensure both compose with existing `withErrorHandling`
    - _Requirements: 4.1, 4.2, 6.5, 6.6_

  - [x] 6.3 Create permissions module
    - Create `lib/permissions.ts` with `canPerformAction` function
    - Implement RBAC logic: Admin → all access; Manager → full project/task access; Member → read all, write only owned resources
    - Handle null ownerId for legacy data (grant access)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.4 Write property tests for RBAC logic
    - **Property 9: Role-based access control consistency**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 7. Middleware and route handler
  - [x] 7.1 Create Next.js middleware
    - Create `middleware.ts` at project root
    - Define public paths: /login, /register, /api/auth, /api/auth/register
    - For public paths: redirect authenticated users away from login/register to dashboard
    - For protected paths: return 401 JSON for API routes, redirect to /login for pages
    - Configure matcher to exclude _next/static, _next/image, favicon.ico
    - _Requirements: 4.1, 4.3, 5.1, 5.2_

  - [x] 7.2 Create NextAuth.js route handler
    - Create `app/api/auth/[...nextauth]/route.ts`
    - Export GET and POST handlers from `lib/auth`
    - _Requirements: 2.1, 3.1_

  - [x] 7.3 Write property tests for route protection
    - **Property 7: Unauthenticated API rejection**
    - **Property 8: Invalid JWT rejection**
    - **Validates: Requirements 4.1, 10.5**

- [x] 8. API routes
  - [x] 8.1 Create registration endpoint
    - Create `app/api/auth/register/route.ts`
    - POST handler: validate body with `registerSchema`, call `authService.register()`, return 201 with user data
    - Wrap with `withErrorHandling` (no auth required)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 8.2 Create profile endpoint
    - Create `app/api/users/me/route.ts`
    - GET handler: `withAuth` + `withErrorHandling`, call `userService.getProfile(req.user.id)`
    - PATCH handler: `withAuth` + `withErrorHandling`, validate with `updateProfileSchema`, call `userService.updateProfile()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 8.3 Create admin user management endpoints
    - Create `app/api/admin/users/route.ts` with GET handler (list all users)
    - Create `app/api/admin/users/[id]/route.ts` with PATCH handler (change role)
    - Both wrapped with `withAuth` + `withRole("Admin")` + `withErrorHandling`
    - Validate role change with `changeRoleSchema`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 8.4 Write property tests for API responses
    - **Property 5: Authentication failure indistinguishability**
    - **Property 10: Password exclusion from responses**
    - **Property 13: Non-Admin user management denial**
    - **Validates: Requirements 2.2, 2.3, 10.4, 11.4**

- [x] 9. Update existing API routes with auth
  - [x] 9.1 Add withAuth to existing project routes
    - Update `app/api/projects/route.ts` to wrap handlers with `withAuth` + `withErrorHandling`
    - Update `app/api/projects/[id]/route.ts` to wrap handlers with `withAuth` + `withErrorHandling`
    - Add ownership checks using `canPerformAction` for update/delete operations
    - Set `ownerId` to current user on project creation
    - _Requirements: 4.1, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 9.2 Add withAuth to existing task routes
    - Update `app/api/tasks/route.ts` to wrap handlers with `withAuth` + `withErrorHandling`
    - Update `app/api/tasks/[id]/route.ts` to wrap handlers with `withAuth` + `withErrorHandling`
    - Add ownership checks using `canPerformAction` for update/delete operations
    - Set `createdById` to current user on task creation
    - _Requirements: 4.1, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 9.3 Add withAuth to dashboard route
    - Update `app/api/dashboard/route.ts` to wrap handler with `withAuth` + `withErrorHandling`
    - _Requirements: 4.1_

- [x] 10. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend authentication components
  - [x] 11.1 Update providers with SessionProvider
    - Wrap existing providers in `app/providers.tsx` with NextAuth.js `SessionProvider`
    - _Requirements: 3.1, 3.4_

  - [x] 11.2 Create AuthGuard component
    - Create `components/auth/AuthGuard.tsx` as a client component
    - Use `useSession()` hook to check auth status
    - Show loading spinner while status is "loading"
    - Redirect to /login if status is "unauthenticated"
    - Render children if authenticated
    - _Requirements: 5.1, 5.3_

  - [x] 11.3 Create login page
    - Create `app/(auth)/login/page.tsx` with email and password fields
    - Use React Hook Form with Zod resolver for validation
    - Call `signIn("credentials", { ... })` on submit
    - Display generic "Invalid email or password" error on failure
    - Include link to /register
    - _Requirements: 9.1, 9.4, 9.6_

  - [x] 11.4 Create registration page
    - Create `app/(auth)/register/page.tsx` with name, email, password, confirmPassword fields
    - Use React Hook Form with Zod resolver
    - Client-side validation: confirmPassword must match password (prevent API call if mismatch)
    - Call `POST /api/auth/register` then `signIn()` on success
    - Show "Email already in use" on 409 error
    - Include link to /login
    - _Requirements: 9.2, 9.3, 9.5, 9.6_

  - [x] 11.5 Create auth layout (no AppShell)
    - Create `app/(auth)/layout.tsx` that renders children without AppShell sidebar/header
    - _Requirements: 9.7_

  - [x] 11.6 Write property test for registration form validation
    - **Property 14: Registration confirmation password mismatch**
    - **Validates: Requirements 9.3**

- [x] 12. Protected layout and page restructuring
  - [x] 12.1 Create protected layout with AuthGuard
    - Create `app/(protected)/layout.tsx` that wraps children with `AuthGuard` and `AppShell`
    - _Requirements: 5.1, 5.3_

  - [x] 12.2 Move existing pages into (protected) route group
    - Move `app/page.tsx` → `app/(protected)/page.tsx` (dashboard)
    - Move `app/projects/` → `app/(protected)/projects/`
    - Move `app/tasks/` → `app/(protected)/tasks/`
    - Update any import paths affected by the move
    - _Requirements: 5.1_

  - [x] 12.3 Update Header with user menu and logout
    - Update `components/layout/Header.tsx` to show user avatar/initial on the right
    - Add dropdown menu with user name, role display, and "Sign Out" button
    - Use `useSession()` for user info and `signOut()` for logout action
    - _Requirements: 3.3_

- [x] 13. Admin user management page
  - [x] 13.1 Create admin users page
    - Create `app/(protected)/admin/users/page.tsx`
    - Display table of all users (id, email, name, role, createdAt)
    - Add role dropdown for each user (disabled for current admin's own row)
    - Call `PATCH /api/admin/users/[id]` on role change
    - Add role-based access check (redirect non-Admin users)
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

- [x] 14. Checkpoint - Integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Integration tests
  - [x] 15.1 Write integration tests for auth API routes
    - Test registration success and validation errors
    - Test login success and failure (indistinguishable errors)
    - Test protected route rejection without session
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 4.1_

  - [x] 15.2 Write integration tests for admin endpoints
    - Test admin can list users and change roles
    - Test non-admin receives 403 on admin endpoints
    - Test admin cannot change own role
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 15.3 Write integration tests for RBAC on existing routes
    - Test Member can only modify own resources
    - Test Manager can modify all projects/tasks
    - Test ownership assignment on create
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 16. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The (auth) and (protected) route groups use Next.js route group convention — parenthesized folder names do not affect URL paths
- Existing data remains valid because new foreign keys (ownerId, createdById) are nullable
- The `withAuth` and `withRole` HOFs compose with the existing `withErrorHandling` wrapper

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["4.1", "4.3"] },
    { "id": 4, "tasks": ["4.2", "4.4", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4", "7.1", "7.2"] },
    { "id": 7, "tasks": ["7.3", "8.1", "8.2", "8.3"] },
    { "id": 8, "tasks": ["8.4", "9.1", "9.2", "9.3"] },
    { "id": 9, "tasks": ["11.1"] },
    { "id": 10, "tasks": ["11.2", "11.5"] },
    { "id": 11, "tasks": ["11.3", "11.4", "12.1"] },
    { "id": 12, "tasks": ["11.6", "12.2", "12.3"] },
    { "id": 13, "tasks": ["13.1"] },
    { "id": 14, "tasks": ["15.1", "15.2", "15.3"] }
  ]
}
```
