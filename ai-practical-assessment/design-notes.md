# Design Notes

## Architecture Overview

Layered monorepo architecture with clear unidirectional dependency flow:

```
Browser (React + MUI + TanStack Query)
    ↓ HTTP/Axios
API Route Handlers (app/api/)
    ↓
Zod Validators
    ↓
Service Layer (business logic)
    ↓
Repository Layer (data access)
    ↓
Prisma ORM → PostgreSQL
```

Cross-cutting: NextAuth.js middleware + withAuth/withRole HOFs

## Frontend Design

- **Framework:** Next.js 15 App Router (React 19)
- **UI Library:** Material UI 6 with custom theme
- **State:** TanStack Query for server state, React state for UI state
- **Forms:** React Hook Form + @hookform/resolvers + Zod
- **Routing:** Route groups — `(auth)` for login/register, `(protected)` for authenticated pages
- **Components:** AppShell (sidebar + header), AuthGuard, common UI components

## Backend Design

- **API:** Next.js Route Handlers (RESTful)
- **Auth:** NextAuth.js v5 (credentials provider, JWT strategy)
- **Validation:** Zod strict schemas on all inputs
- **Services:** Business logic layer (status transitions, progress calculation, password hashing)
- **Repositories:** Prisma-based data access (password excluded from reads)
- **Error handling:** Custom error classes (AppError hierarchy) + centralized withErrorHandling HOF

## Database Design

- **ORM:** Prisma 6.2
- **Database:** PostgreSQL
- **Models:** User, Project, Task
- **Enums:** Role (Admin/Manager/Member), ProjectStatus, TaskStatus, Priority
- **Relations:** User→Projects (1:many), User→Tasks (1:many), Project→Tasks (1:many, cascade delete)
- **Indexes:** ownerId, createdById, projectId, status, dueDate

## Validation Strategy

- All API inputs validated with Zod `.strict()` schemas (reject unknown fields)
- Client-side validation with same Zod schemas via @hookform/resolvers
- Cross-field validation (e.g., dueDate >= startDate, confirmPassword === password)
- Custom error messages on every constraint

## Error Handling Strategy

- Custom error class hierarchy extending AppError
- withErrorHandling HOF wraps all route handlers
- Maps AppError → appropriate HTTP status + consistent JSON structure
- Maps Prisma errors (P2002 → 409, P2025 → 404)
- Never exposes internal details (500s return generic message)

## Testing Strategy Link

See [test-strategy.md](./test-strategy.md)
