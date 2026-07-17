# Reflection

## What I Built

A production-quality Project Tracker with full authentication and authorization. The application has 110+ source files, 590 passing tests, and covers the full stack from database to UI.

## How I Used AI (across the lifecycle)

| Phase | AI Role | My Role |
|-------|---------|---------|
| Requirements | Generated detailed EARS-format specs | Reviewed, approved scope |
| Design | Created architecture, API contracts, DB schema | Validated design decisions |
| Planning | Generated dependency-ordered task list | Approved execution plan |
| Implementation | Wrote all code autonomously | Monitored progress, resolved blockers |
| Testing | Generated unit, integration, and PBT tests | Verified test quality and coverage |
| Debugging | Identified root causes, suggested fixes | Validated fixes against real environment |
| Documentation | Generated all spec documents | Reviewed for accuracy |

## What AI Helped With Most

1. **Consistent architecture** — Kiro maintained the same patterns across 110+ files without deviation
2. **Property-based testing** — Generated formal correctness properties that I wouldn't have thought to write manually
3. **Dependency management** — Task ordering prevented circular dependencies and ensured clean layer separation
4. **Boilerplate reduction** — Forms, API routes, validators all followed repeatable patterns

## What AI Got Wrong

1. **NextRequest constructor** — Used outdated API; fixed during final checkpoint
2. **Async params in Next.js 15** — Some route handlers needed `await ctx.params` which is a Next.js 15 change
3. **jest.Mocked vs Vitest** — Mixed testing library APIs in one test file
4. **Missing field propagation** — Adding `createdById` to schema didn't automatically propagate to all mapping functions

All issues were caught by the TypeScript compiler or test suite, never reaching production.

## How I Validated AI Output

1. **TypeScript strict mode** — Catches type errors at compile time
2. **Vitest test suite** — 590 tests verify behavior
3. **Property-based tests** — 100+ random inputs per property catch edge cases
4. **Manual review** — Checked critical security paths (password hashing, auth flow, RBAC)
5. **Final checkpoint** — Full tsc + vitest run before marking complete

## What I Would Improve Next

1. Add E2E tests with Playwright for critical user flows
2. Implement pagination for large datasets
3. Add rate limiting on auth endpoints
4. Add email verification before account activation
5. Set up CI/CD pipeline with automated testing
6. Add observability (structured logging, error tracking)

## Reusable Workflow (prompts, rules, specs, templates)

The Kiro spec-driven workflow is fully reusable:
1. Describe feature in natural language
2. Let Kiro generate requirements (review and approve)
3. Let Kiro generate design (review and approve)
4. Let Kiro generate tasks (review dependency order)
5. Execute tasks with autonomous verification
6. Final checkpoint to catch any issues

Key prompts that worked well:
- "Build a modern Project Tracker application that helps teams..." (comprehensive initial spec)
- "Add a complete Authentication and Authorization system" (extension via Quick Spec)
- "Run all tasks" (autonomous execution with verification)
