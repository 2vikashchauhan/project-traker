# AI Practical Assessment — Project Tracker

## Project Overview

A full-stack **Project Tracker** application with authentication and role-based access control, built using AI-assisted development with Kiro IDE.

The application enables teams to plan, organize, and monitor projects and tasks through:
- Real-time dashboard with project/task statistics
- Full CRUD operations for projects and tasks
- Status workflow enforcement with valid transition rules
- Search and filtering capabilities
- Authentication (email/password via NextAuth.js v5)
- Role-Based Access Control (Admin / Manager / Member)
- Property-based testing (590 passing tests)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.7 (strict mode) |
| Database | PostgreSQL + Prisma 6.2 ORM |
| Auth | NextAuth.js v5 (credentials + JWT) |
| UI | Material UI 6 |
| State | TanStack Query 5 |
| Forms | React Hook Form + Zod |
| Testing | Vitest + fast-check |
| AI Tool | Kiro IDE |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL

# 3. Run database migrations
npx prisma migrate deploy

# 4. Start development server
npm run dev
# Open http://localhost:3000

# 5. Run tests
npm run test
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (protected)/       # Protected pages (dashboard, projects, tasks, admin)
│   └── api/               # API routes
│       ├── auth/          # NextAuth + registration
│       ├── dashboard/     # Dashboard statistics
│       ├── projects/      # Project CRUD
│       ├── tasks/         # Task CRUD
│       └── admin/         # User management
├── components/            # Shared UI components
├── features/              # Feature-specific components
├── hooks/                 # Custom React hooks (TanStack Query)
├── lib/                   # Core utilities (auth, prisma, errors, permissions)
├── prisma/                # Database schema + migrations
├── tests/                 # Test files
└── middleware.ts          # Route protection
```

## Key Features

### Dashboard
- Total/active/completed project counts
- Overdue task count
- Upcoming deadlines (next 7 days, max 20)
- Progress overview

### Projects
- Create, read, update, delete
- Status workflow: Planned → In Progress → Completed / On Hold / Cancelled
- Priority levels: Low, Medium, High
- Auto-calculated progress from task completion

### Tasks
- Create, read, update, delete (linked to projects)
- Status workflow: Todo → In Progress → Review → Done
- Assignee tracking
- Cascade delete with parent project

### Auth & RBAC
- Email/password registration (bcrypt, cost factor 10)
- JWT sessions via NextAuth.js v5
- Three roles: Admin (full access), Manager (all CRUD), Member (own resources)
- Middleware-based route protection
- Admin user management panel

## Testing

```bash
# Run all tests
npm run test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

- 590 total tests passing
- Unit tests for services and validators
- Integration tests for API routes
- Property-based tests (fast-check) for correctness properties

## AI Tool Used

**Kiro IDE** — An AI-powered development environment that uses spec-driven development:
1. Requirements → Design → Tasks methodology
2. Autonomous task execution with verification
3. Property-based test generation alongside implementation

See `tool-workflow.md` for detailed workflow documentation.
