# Tests

The full test suite is in `/home/vikash/Dashboard/tests/`.

## Structure

```
tests/
├── unit/
│   ├── lib/              — Error classes, API handler, permissions
│   ├── validators/       — All Zod schema tests
│   ├── services/         — Service layer tests (mocked repos)
│   └── repositories/     — Repository tests (mocked Prisma)
├── integration/
│   └── api/              — Route handler integration tests
│       ├── auth.test.ts
│       ├── admin-users.test.ts
│       ├── rbac.test.ts
│       ├── projects.test.ts
│       ├── tasks.test.ts
│       └── dashboard.test.ts
├── pbt/
│   ├── services/         — Auth and user service properties
│   ├── lib/              — Permissions RBAC properties
│   ├── middleware/       — Route protection properties
│   ├── api/              — API response properties
│   └── frontend/         — Registration form properties
└── property/             — Status transition and progress properties
```

## Running Tests

```bash
cd /home/vikash/Dashboard
npm run test              # Run all (590 tests)
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npx vitest run tests/pbt  # Only property-based tests
```

## Test Results

- ✅ 590 tests passing
- ✅ 0 failures
- ✅ 35 test files
