# Code Review Notes

## AI-Assisted Review Summary

Kiro performed continuous verification during implementation:
- TypeScript compilation check (`npx tsc --noEmit`) after every file change
- Test execution (`npx vitest run`) after every task completion
- Final checkpoint running full suite (590 tests)

## My Review Observations

### Strengths
1. **Consistent architecture** — Every API route follows the same pattern: `withErrorHandling(withAuth(handler))`
2. **Password never leaked** — Repository uses Prisma `select` to exclude hashedPassword from all reads except login
3. **Backward compatibility** — Null ownerId/createdById handled gracefully for legacy data
4. **Strict validation** — All Zod schemas use `.strict()` rejecting unknown fields
5. **Property-based tests** — Formal correctness properties provide high confidence

### Concerns Addressed
1. **Self-role-change prevention** — Verified ForbiddenError thrown when adminId === targetUserId
2. **Generic auth errors** — Login returns same null for both "email not found" and "wrong password"
3. **Session user injection** — withAuth properly attaches user to request before handler runs

## Changes Made After Review

1. Added `createdById` to task repository's `mapToTaskWithProject` function (was missing initially)
2. Fixed NextRequest constructor types in integration tests (Next.js 15 API change)
3. Added `ownerId` to project type interfaces and fixtures
4. Updated dashboard integration test to mock auth (after withAuth was added to the route)

## Suggestions Rejected (and why)

None — all AI suggestions were validated against the test suite and TypeScript compiler. When tests failed, the fixes were correct.
