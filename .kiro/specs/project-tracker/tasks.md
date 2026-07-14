# Implementation Plan: Project Tracker

## Overview

A full-stack Project Tracker application built with Next.js 15 (App Router), TypeScript, Material UI, TanStack Query, React Hook Form, Zod, and Prisma ORM backed by PostgreSQL. Implementation follows a layered architecture: Route Handlers → Validators → Services → Repositories → Prisma/PostgreSQL. Tasks are ordered bottom-up (types/lib → data layer → business logic → API → frontend) to ensure each layer builds on completed dependencies.

## Tasks

- [ ] 1. Set up project foundation and shared types
  - [ ] 1.1 Initialize Next.js 15 project with TypeScript strict mode, install all dependencies (MUI, TanStack Query, React Hook Form, Zod, Prisma, Axios, Vitest, fast-check), and configure tsconfig.json with `strict: true`
    - Create `package.json` with all required dependencies
    - Create `tsconfig.json` with strict mode enabled
    - Create `next.config.ts`
    - Create `.env.local` with DATABASE_URL placeholder
    - _Requirements: 25.3_

  - [ ] 1.2 Define shared TypeScript types and enums
    - Create `types/common.types.ts` with Priority, ProjectStatus, TaskStatus enums
    - Create `types/project.types.ts` with Project, ProjectWithTasks, CreateProjectInput, UpdateProjectInput interfaces
    - Create `types/task.types.ts` with Task, TaskWithProject, CreateTaskInput, UpdateTaskInput interfaces
    - Create `types/api.types.ts` with DashboardResponse, ErrorResponse, ListQueryParams, PaginatedResponse interfaces
    - _Requirements: 6.1, 11.1, 25.1_

  - [ ] 1.3 Create shared library utilities
    - Create `lib/prisma.ts` with Prisma client singleton pattern
    - Create `lib/errors.ts` with AppError, ValidationError, NotFoundError, ConflictError, TransitionError classes
    - Create `lib/api-client.ts` with configured Axios instance
    - _Requirements: 20.1, 20.2, 25.2_

  - [ ] 1.4 Create utility modules
    - Create `utils/status-transitions.ts` with PROJECT_STATUS_TRANSITIONS and TASK_STATUS_TRANSITIONS maps
    - Create `utils/progress.utils.ts` with calculateProjectProgress function
    - Create `utils/date.utils.ts` with date formatting and comparison helpers
    - _Requirements: 6.2, 11.2, 18.1, 18.2_

- [ ] 2. Set up database schema and data access layer
  - [ ] 2.1 Create Prisma schema and generate initial migration
    - Create `prisma/schema.prisma` with Project and Task models, enums (ProjectStatus, TaskStatus, Priority), foreign key with cascade delete, indexes on projectId, status, and dueDate
    - Run `npx prisma migrate dev --name init` to generate migration
    - Run `npx prisma generate` to generate client
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7_

  - [ ] 2.2 Implement ProjectRepository
    - Create `repositories/project.repository.ts` with methods: findAll, findById, create, update, delete, countByStatus, countAll, getAverageProgress
    - Implement search (case-insensitive substring on name/description), status filter, priority filter, sortBy dueDate with null handling
    - _Requirements: 3.1, 3.2, 13.1, 15.1, 16.1, 17.1, 17.5_

  - [ ] 2.3 Implement TaskRepository
    - Create `repositories/task.repository.ts` with methods: findAll, findById, create, update, delete, countByProjectAndStatus, countByProject, findOverdue, findUpcomingDeadlines
    - Implement search (case-insensitive substring on title/description), status filter, priority filter, sortBy dueDate with null handling
    - _Requirements: 8.1, 8.2, 14.1, 15.2, 16.2, 17.2, 17.5_

- [ ] 3. Implement validation layer
  - [ ] 3.1 Create common validators
    - Create `validators/common.validator.ts` with UUID validator, pagination/query params schema (search, status, priority, sortBy, sortOrder), with strict mode to reject unknown fields
    - _Requirements: 19.1, 19.3, 19.4_

  - [ ] 3.2 Create project validators
    - Create `validators/project.validator.ts` with createProjectSchema (name: 1-100 chars trimmed required, description: 0-500 chars optional, priority: enum required, startDate/dueDate: ISO date optional with dueDate >= startDate constraint, status: optional defaults to Planned) and updateProjectSchema (all fields optional, same constraints)
    - Enable strict mode to reject unknown fields
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.9, 4.3, 19.1, 19.3, 19.4, 19.5_

  - [ ] 3.3 Create task validators
    - Create `validators/task.validator.ts` with createTaskSchema (title: 1-150 chars trimmed required, description: 0-1000 chars optional, priority: enum required, projectId: UUID required, status: optional defaults to Todo, dueDate: optional, assignedTo: 1-100 chars or null optional) and updateTaskSchema (all fields optional, same constraints)
    - Enable strict mode to reject unknown fields
    - _Requirements: 7.4, 7.5, 7.6, 7.11, 9.3, 12.4, 19.1, 19.3, 19.4_

  - [ ]* 3.4 Write property tests for validators (Properties 1, 2, 3, 4)
    - **Property 1: Zod Schema Round-Trip Preservation**
    - **Property 2: Validator Rejects Invalid String Inputs**
    - **Property 3: Date Constraint Enforcement**
    - **Property 4: Unknown Fields Rejection**
    - Create `tests/property/validators.property.test.ts`
    - **Validates: Requirements 19.5, 19.3, 2.4, 2.5, 2.7, 2.9, 7.4, 7.5, 7.11, 12.4, 13.5, 14.5, 19.4**

- [ ] 4. Implement service layer
  - [ ] 4.1 Implement ProjectService
    - Create `services/project.service.ts` with methods: listProjects, getProjectById, createProject, updateProject, deleteProject
    - Enforce status transition rules via utils/status-transitions.ts
    - Set progress to 100 when status changes to Completed
    - Set initial status to Planned and progress to 0 on create
    - Throw NotFoundError for missing projects, TransitionError for invalid transitions
    - _Requirements: 2.1, 2.2, 2.3, 2.10, 3.2, 3.3, 4.1, 4.2, 4.4, 5.1, 5.3, 6.2, 6.3, 6.4, 6.5_

  - [ ] 4.2 Implement TaskService
    - Create `services/task.service.ts` with methods: listTasks, getTaskById, createTask, updateTask, deleteTask, recalculateProjectProgress
    - Enforce task status transition rules
    - Recalculate project progress on task status change to Done, and on task deletion
    - Verify projectId references existing project on create/update
    - Throw NotFoundError for missing tasks/projects, TransitionError for invalid transitions
    - _Requirements: 7.1, 7.2, 7.3, 7.7, 7.8, 8.3, 9.1, 9.2, 9.4, 9.5, 9.7, 10.1, 10.2, 10.3, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.5, 18.1, 18.2, 18.3, 18.5_

  - [ ] 4.3 Implement DashboardService
    - Create `services/dashboard.service.ts` with method: getDashboardStats
    - Aggregate totalProjects, activeProjects, completedProjects, overdueTasks, upcomingDeadlines (7 days, max 20), averageProgress
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9_

  - [ ]* 4.4 Write property tests for status transitions (Properties 5, 6)
    - **Property 5: Project Status Transition Enforcement**
    - **Property 6: Task Status Transition Enforcement**
    - Create `tests/property/status.property.test.ts`
    - **Validates: Requirements 6.1, 6.2, 6.3, 11.1, 11.2, 11.4, 11.5**

  - [ ]* 4.5 Write property tests for progress calculation (Property 7)
    - **Property 7: Progress Calculation Correctness**
    - Create `tests/property/progress.property.test.ts`
    - **Validates: Requirements 18.1, 18.2, 9.5, 10.2, 6.4**

- [ ] 5. Checkpoint - Core backend logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement API route handlers
  - [ ] 6.1 Create error handling middleware
    - Create `lib/api-handler.ts` with withErrorHandling wrapper that maps AppError subclasses and Prisma errors to appropriate HTTP responses
    - Handle ValidationError (400), NotFoundError (404), ConflictError (409), TransitionError (400), PrismaClientKnownRequestError (P2002→409, P2025→404), and unhandled errors (500)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [ ] 6.2 Implement Dashboard API route
    - Create `app/api/dashboard/route.ts` with GET handler
    - Return all dashboard statistics in single response
    - _Requirements: 1.7_

  - [ ] 6.3 Implement Projects API routes
    - Create `app/api/projects/route.ts` with GET (list/search/filter/sort) and POST (create) handlers
    - Create `app/api/projects/[id]/route.ts` with GET (detail with tasks), PUT (update), DELETE (cascade) handlers
    - Validate request body with Zod before passing to service, validate UUID params
    - Return appropriate status codes: 201 for create, 200 for get/update/delete, 400/404/409 for errors
    - _Requirements: 2.1, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 13.1, 13.2, 13.3, 13.4, 13.5, 15.1, 15.3, 15.4, 15.5, 16.1, 16.3, 16.4, 16.5, 16.6, 17.1, 17.3, 17.4, 17.5, 17.6, 17.7, 19.6_

  - [ ] 6.4 Implement Tasks API routes
    - Create `app/api/tasks/route.ts` with GET (list/search/filter/sort) and POST (create) handlers
    - Create `app/api/tasks/[id]/route.ts` with GET (detail), PUT (update), DELETE handlers
    - Validate request body with Zod before passing to service, validate UUID params
    - Return appropriate status codes: 201 for create, 200 for get/update/delete, 400/404/409 for errors
    - _Requirements: 7.1, 7.8, 7.9, 7.10, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.4, 9.6, 10.1, 10.3, 10.4, 10.5, 14.1, 14.2, 14.3, 14.4, 14.5, 15.2, 15.3, 15.4, 15.5, 16.2, 16.3, 16.4, 16.5, 16.6, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 19.6_

  - [ ]* 6.5 Write property tests for search and filter (Properties 8, 9, 10, 11)
    - **Property 8: Search Filter Correctness**
    - **Property 9: Status Filter Correctness**
    - **Property 10: Priority Filter Correctness**
    - **Property 11: Sort Ordering Correctness**
    - Create `tests/property/search.property.test.ts`, `tests/property/filter.property.test.ts`, `tests/property/sort.property.test.ts`
    - **Validates: Requirements 13.1, 13.4, 14.1, 14.4, 15.1, 15.2, 15.3, 16.1, 16.2, 16.3, 16.6, 17.1, 17.2, 17.5**

  - [ ]* 6.6 Write property test for overdue identification (Property 13)
    - **Property 13: Overdue Task Identification**
    - Create `tests/property/overdue.property.test.ts`
    - **Validates: Requirements 1.4**

- [ ] 7. Checkpoint - Full API layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement frontend layout and shared components
  - [ ] 8.1 Create root layout with MUI ThemeProvider and QueryClientProvider
    - Create `app/layout.tsx` with MUI CssBaseline, ThemeProvider (default theme), and QueryClientProvider wrapping children
    - Configure TanStack Query with retry: 3 and exponential backoff
    - _Requirements: 22.1, 22.5, 24.1_

  - [ ] 8.2 Create AppShell layout with sidebar and header
    - Create `components/layout/AppShell.tsx` with responsive sidebar navigation and top header
    - Create `components/layout/Sidebar.tsx` with navigation links to Dashboard, Projects, Tasks
    - Create `components/layout/Header.tsx` with application title
    - Ensure responsive behavior for 768px–1920px viewports, 44x44px touch targets below 1024px
    - _Requirements: 24.2, 24.4, 25.1_

  - [ ] 8.3 Create common UI components
    - Create `components/common/LoadingSpinner.tsx` for loading states
    - Create `components/common/ErrorDisplay.tsx` with error message and retry button
    - Create `components/common/ConfirmDialog.tsx` for delete confirmation
    - Create `components/common/StatusBadge.tsx` for colored status pills
    - Create `components/common/PriorityBadge.tsx` for priority indicators
    - Create `components/common/ProgressBar.tsx` for progress visualization
    - _Requirements: 22.3, 22.4, 24.1, 24.3_

- [ ] 9. Implement frontend data hooks
  - [ ] 9.1 Create TanStack Query hooks for projects
    - Create `hooks/useProjects.ts` with useProjects (list with params), useProject (single), useCreateProject, useUpdateProject, useDeleteProject mutations
    - Configure cache invalidation on mutations (invalidate project queries on create/update/delete)
    - _Requirements: 22.1, 22.2, 22.6_

  - [ ] 9.2 Create TanStack Query hooks for tasks
    - Create `hooks/useTasks.ts` with useTasks (list with params), useTask (single), useCreateTask, useUpdateTask, useDeleteTask mutations
    - Configure cache invalidation on mutations (invalidate task and project queries on task mutations since progress changes)
    - _Requirements: 22.1, 22.2, 22.6_

  - [ ] 9.3 Create TanStack Query hook for dashboard
    - Create `hooks/useDashboard.ts` with useDashboard hook
    - Configure stale time and cache invalidation
    - _Requirements: 22.1, 22.6_

- [ ] 10. Implement frontend forms
  - [ ] 10.1 Create ProjectForm component
    - Create `components/forms/ProjectForm.tsx` using React Hook Form with Zod resolver
    - Fields: name, description, priority (select), startDate (date picker), dueDate (date picker)
    - Client-side validation matching server validators
    - Pre-populate fields in edit mode, disable submit during submission
    - Display inline field-level validation errors, clear on correction
    - _Requirements: 23.1, 23.2, 23.4, 23.5, 23.6, 23.7, 24.3_

  - [ ] 10.2 Create TaskForm component
    - Create `components/forms/TaskForm.tsx` using React Hook Form with Zod resolver
    - Fields: title, description, priority (select), dueDate (date picker), assignedTo (text), projectId (select from projects)
    - Client-side validation matching server validators
    - Pre-populate fields in edit mode, disable submit during submission
    - Display inline field-level validation errors, clear on correction
    - _Requirements: 23.1, 23.2, 23.4, 23.5, 23.6, 23.7, 24.3_

- [ ] 11. Implement feature pages - Dashboard
  - [ ] 11.1 Create Dashboard page and feature components
    - Create `features/dashboard/DashboardStats.tsx` with stats cards (total projects, active, completed, overdue tasks)
    - Create `features/dashboard/UpcomingDeadlines.tsx` with deadline list showing task name, due date, project name
    - Create `features/dashboard/ProgressOverview.tsx` with average progress display
    - Create `app/page.tsx` composing all dashboard components with loading/error states
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 22.3, 22.4_

- [ ] 12. Implement feature pages - Projects
  - [ ] 12.1 Create Projects list page with search and filters
    - Create `features/projects/ProjectFilters.tsx` with search input, status dropdown, priority dropdown, sort controls
    - Create `features/projects/ProjectCard.tsx` with project summary (name, status badge, priority badge, progress bar, dates)
    - Create `features/projects/ProjectList.tsx` composing filter and card list
    - Create `app/projects/page.tsx` with loading/error states and link to create
    - _Requirements: 3.1, 3.5, 13.1, 13.2, 13.3, 15.1, 15.4, 16.1, 16.4, 17.1, 17.3, 22.3, 22.4_

  - [ ] 12.2 Create Project detail page
    - Create `features/projects/ProjectDetail.tsx` showing all project fields, progress bar, task list with status badges
    - Create `app/projects/[id]/page.tsx` with loading/error states, edit/delete actions, and task listing
    - Include ConfirmDialog for delete with cascade warning
    - _Requirements: 3.2, 3.3, 3.6, 5.1, 18.4_

  - [ ] 12.3 Create Project create and edit pages
    - Create `app/projects/new/page.tsx` using ProjectForm in create mode, navigate to list on success
    - Create `app/projects/[id]/edit/page.tsx` using ProjectForm in edit mode with pre-populated data, navigate to detail on success
    - _Requirements: 2.1, 4.1, 23.3, 23.4_

- [ ] 13. Implement feature pages - Tasks
  - [ ] 13.1 Create Tasks list page with search and filters
    - Create `features/tasks/TaskFilters.tsx` with search input, status dropdown, priority dropdown, sort controls
    - Create `features/tasks/TaskCard.tsx` with task summary (title, status badge, priority badge, due date, assignee)
    - Create `features/tasks/TaskList.tsx` composing filter and card list
    - Create `app/tasks/page.tsx` with loading/error states and link to create
    - _Requirements: 8.1, 8.5, 14.1, 14.2, 14.3, 15.2, 15.4, 16.2, 16.4, 17.2, 17.3, 22.3, 22.4_

  - [ ] 13.2 Create Task detail page
    - Create `features/tasks/TaskDetail.tsx` showing all task fields with status badge and priority badge
    - Create `app/tasks/[id]/page.tsx` with loading/error states, edit/delete actions
    - Include ConfirmDialog for delete
    - _Requirements: 8.2, 8.3, 8.6, 10.1_

  - [ ] 13.3 Create Task create and edit pages
    - Create `app/tasks/new/page.tsx` using TaskForm in create mode, navigate to list on success
    - Create `app/tasks/[id]/edit/page.tsx` using TaskForm in edit mode with pre-populated data, navigate to detail on success
    - _Requirements: 7.1, 9.1, 12.1, 23.3, 23.4_

- [ ] 14. Checkpoint - Full application wired together
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 15. Write property test for data integrity (Property 12)
  - [ ]* 15.1 Write property test for failed validation preserving data
    - **Property 12: Failed Validation Preserves Data Integrity**
    - Create `tests/property/integrity.property.test.ts`
    - Test that for any invalid update request, the database record remains unchanged
    - **Validates: Requirements 4.6**

- [ ]* 16. Write integration tests for API endpoints
  - [ ]* 16.1 Write integration tests for Dashboard API
    - Create `tests/integration/api/dashboard.test.ts`
    - Test GET /api/dashboard with various data scenarios (empty, with projects/tasks, overdue tasks)
    - _Requirements: 1.7, 1.8, 1.9_

  - [ ]* 16.2 Write integration tests for Projects API
    - Create `tests/integration/api/projects.test.ts`
    - Test CRUD operations, status transitions, validation errors, cascade delete, search/filter/sort
    - _Requirements: 2.1–2.10, 3.1–3.6, 4.1–4.6, 5.1–5.5, 6.1–6.5, 13.1–13.5, 15.1, 16.1, 17.1_

  - [ ]* 16.3 Write integration tests for Tasks API
    - Create `tests/integration/api/tasks.test.ts`
    - Test CRUD operations, status transitions, progress recalculation, validation errors, search/filter/sort
    - _Requirements: 7.1–7.11, 8.1–8.6, 9.1–9.7, 10.1–10.5, 11.1–11.5, 14.1–14.5, 15.2, 16.2, 17.2_

- [ ] 17. Final checkpoint - Complete application
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript throughout (Next.js 15 + Node.js runtime)
- Database must be PostgreSQL; ensure Docker or local PostgreSQL is available for development
- All API responses follow the consistent ErrorResponse format defined in the design

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["3.4", "4.1", "4.2", "4.3"] },
    { "id": 6, "tasks": ["4.4", "4.5", "6.1"] },
    { "id": 7, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 8, "tasks": ["6.5", "6.6", "8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3", "9.1", "9.2", "9.3"] },
    { "id": 10, "tasks": ["10.1", "10.2"] },
    { "id": 11, "tasks": ["11.1", "12.1", "13.1"] },
    { "id": 12, "tasks": ["12.2", "12.3", "13.2", "13.3"] },
    { "id": 13, "tasks": ["15.1"] },
    { "id": 14, "tasks": ["16.1", "16.2", "16.3"] }
  ]
}
```
