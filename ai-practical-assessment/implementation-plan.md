# Implementation Plan

## Overview

Two-phase implementation: first the core Project Tracker (58 tasks), then the Auth System extension (52 tasks). Both followed bottom-up dependency ordering to ensure each layer builds on completed foundations.

## Task Breakdown

### Phase 1: Project Tracker (58 tasks, 15 dependency waves)
| Wave | Tasks | Focus |
|------|-------|-------|
| 1 | Project setup, TypeScript types, shared utilities | Foundation |
| 2 | Prisma schema, migrations | Database |
| 3 | Repositories (Project, Task) | Data access |
| 4 | Zod validators | Input validation |
| 5 | Services (Project, Task, Dashboard) | Business logic |
| 6 | Property-based tests | Correctness |
| 7 | API route handlers | HTTP layer |
| 8 | Error handling middleware | Cross-cutting |
| 9 | MUI theme, AppShell, common components | UI foundation |
| 10 | TanStack Query hooks | Data fetching |
| 11 | React Hook Form + Zod forms | User input |
| 12-15 | Feature pages, integration tests | Features & verification |

### Phase 2: Auth System (52 tasks, 14 dependency waves)
| Wave | Tasks | Focus |
|------|-------|-------|
| 1 | Dependencies, type augmentation, error classes | Foundation |
| 2 | Prisma schema migration (User model, Role enum) | Database |
| 3 | User repository, auth validators | Data + validation |
| 4 | Auth service, user service, PBT | Business logic |
| 5 | NextAuth.js config, auth helpers, permissions | Auth infrastructure |
| 6-8 | Middleware, API routes, ownership checks | Protection |
| 9-13 | Frontend pages, layouts, admin UI | User interface |
| 14 | Integration tests, final checkpoint | Verification |

## Milestones

1. ✅ Core app with full CRUD and dashboard (July 14)
2. ✅ Auth system with RBAC (July 15)
3. ✅ 590 tests passing (July 15)

## AI Usage Plan

- Kiro spec-driven workflow for requirements → design → implementation
- Sub-agent delegation for parallel task execution
- Property-based test generation alongside implementation
- Automatic verification (tsc + vitest) after each task

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Database not available locally | Medium | High | Documented manual setup steps |
| NextAuth.js v5 beta API changes | Low | Medium | Pinned version in package.json |
| Circular dependency in layers | Low | High | Strict bottom-up implementation order |
| Test flakiness with async PBT | Low | Medium | Mocked repositories, deterministic seeds |

## Mitigation

- All dependencies pinned to exact versions
- TypeScript strict mode catches type errors early
- Each task verified with tsc + vitest before marking complete
- Property-based tests use 100+ runs to catch edge cases
