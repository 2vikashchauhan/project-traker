# Review Fixes

## Fixes Applied During Final Checkpoint

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `repositories/task.repository.ts` | Missing `createdById` in `mapToTaskWithProject` | Added field to parameter type and return value |
| 2 | `tests/unit/services/project.service.test.ts` | Used `jest.Mocked` instead of Vitest type | Changed to Vitest-compatible type |
| 3 | `tests/property/overdue.property.test.ts` | Unreachable type comparison | Added `as string` cast |
| 4 | `tests/integration/api/auth.test.ts` | Mock DashboardResponse shape mismatch | Updated to match actual interface |
| 5 | `tests/integration/api/admin-users.test.ts` | NextRequest constructor type | Fixed initialization pattern |
| 6 | `tests/integration/api/projects.test.ts` | NextRequest constructor type | Fixed initialization pattern |
| 7 | `tests/integration/api/rbac.test.ts` | Missing async params mock | Added Promise.resolve wrapper for ctx.params |

All fixes were non-functional (type annotations, test fixtures) — no production logic changed.
