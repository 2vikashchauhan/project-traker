# Source Code

The full source code is in the Dashboard project at `/home/vikash/Dashboard/`.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages and API routes |
| `app/(auth)/` | Login and register pages (public) |
| `app/(protected)/` | Dashboard, projects, tasks (authenticated) |
| `app/api/` | REST API route handlers |
| `components/` | Shared React components (auth, common, forms, layout) |
| `features/` | Feature-specific components (dashboard, projects, tasks) |
| `hooks/` | TanStack Query data-fetching hooks |
| `lib/` | Core utilities (auth, errors, prisma, permissions, api-handler) |
| `repositories/` | Prisma data access layer |
| `services/` | Business logic layer |
| `validators/` | Zod validation schemas |
| `types/` | TypeScript type definitions |
| `middleware.ts` | Next.js edge middleware for route protection |

## Architecture Pattern

```
Route Handlers (app/api/)
    ↓ withErrorHandling + withAuth + withRole
Zod Validators (validators/)
    ↓
Services (services/)
    ↓
Repositories (repositories/)
    ↓
Prisma Client → PostgreSQL
```

## To View Source Code

```bash
cd /home/vikash/Dashboard
```
