# Test Strategy

## Test Scope

590 total tests across three categories:
- Unit tests (validators, services, repositories, error classes)
- Integration tests (API route handlers end-to-end)
- Property-based tests (formal correctness properties)

## Unit Tests

- **Validators:** All Zod schemas tested for valid/invalid inputs, boundary values, strict mode
- **Services:** Business logic tested with mocked repositories
- **Error classes:** Status codes, error types, message formatting
- **Permissions:** canPerformAction pure function tested for all role/action/resource combinations

## Integration Tests

- **Auth routes:** Registration (success, validation, duplicate), login (success, failures), protected route rejection
- **Admin routes:** List users, change roles, non-admin denial, self-role-change prevention
- **RBAC routes:** Member ownership checks, Manager full access, ownership assignment on create
- **Project routes:** CRUD with auth wrappers
- **Task routes:** CRUD with auth wrappers

## Property-Based Tests (fast-check)

| # | Property | Runs | Validates |
|---|----------|------|-----------|
| 1 | Registration assigns Member role | 50 | Req 1.1 |
| 2 | Password hashing integrity (bcrypt cost ≥ 10) | 10 | Req 1.2, 10.1 |
| 3 | Duplicate email rejection | 100 | Req 1.3 |
| 4 | Registration input validation | 100 | Req 1.4-1.6 |
| 5 | Authentication failure indistinguishability | 100 | Req 2.2, 2.3 |
| 7 | Unauthenticated API rejection | 100 | Req 4.1 |
| 8 | Invalid JWT rejection | 100 | Req 10.5 |
| 9 | RBAC consistency | 200 | Req 6.1-6.5 |
| 10 | Password exclusion from responses | 50 | Req 10.4 |
| 11 | Profile update immutability | 100 | Req 7.4 |
| 12 | Admin self-role-change prevention | 100 | Req 11.3 |
| 13 | Non-Admin user management denial | 100 | Req 11.4 |
| 14 | Registration confirmPassword mismatch | 100 | Req 9.3 |

## Edge Case Tests

- Empty database (all zeros)
- Null ownerId (legacy data accessible to all)
- Status transition rejection
- Password at boundary lengths (8, 128)
- Whitespace-only names rejected
- Unknown fields rejected by strict schemas

## Tests Not Covered (and why)

- **E2E browser tests:** Would require Playwright/Cypress setup; out of scope for this assessment timeframe
- **Load/performance tests:** Dashboard 2-second SLA not verified under load
- **Email delivery:** No email verification implemented
- **Session expiry:** Relies on NextAuth.js defaults, not explicitly tested
