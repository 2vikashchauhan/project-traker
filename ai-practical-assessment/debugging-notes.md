# Debugging Notes

## Issue 1: PrismaClientInitializationError

### Problem
App compiled successfully but crashed at runtime with `PrismaClientInitializationError: Can't reach database server at localhost:5432`.

### How I Investigated
Checked terminal output after `npm run dev`. The error clearly indicated PostgreSQL was not running.

### How AI Helped
Kiro identified the root cause immediately and provided manual setup commands for PostgreSQL.

### What I Validated
Confirmed PostgreSQL was not installed (`which psql` returned nothing).

### Final Fix
Install PostgreSQL, create database and user, then run `npx prisma migrate deploy`.

---

## Issue 2: Prisma CLI Cannot Find DATABASE_URL

### Problem
`npx prisma migrate dev` failed with "Environment variable not found: DATABASE_URL".

### How I Investigated
Prisma CLI reads `.env` at project root, not `.env.local` (which Next.js uses).

### How AI Helped
Kiro explained the distinction between `.env` (Prisma CLI) and `.env.local` (Next.js runtime).

### What I Validated
Created `.env` with same DATABASE_URL and re-ran migration successfully.

### Final Fix
Created `/home/vikash/Dashboard/.env` with `DATABASE_URL=postgresql://user:password@localhost:5432/project_tracker?schema=public`.

---

## Issue 3: dpkg Lock During PostgreSQL Install

### Problem
`sudo apt install postgresql` failed because another apt process held the dpkg lock.

### How I Investigated
Error message showed `/var/lib/dpkg/lock-frontend` was locked by another process.

### How AI Helped
Kiro identified the blocking process and suggested killing it or waiting.

### What I Validated
Checked running processes with `ps aux | grep apt`.

### Final Fix
Waited for the other apt process to complete, then retried installation.

---

## Issue 4: Integration Test Failures After Auth Migration

### Problem
After adding withAuth wrappers to existing routes, some integration tests failed because they didn't mock `auth()`.

### How I Investigated
Test error messages showed 401 responses where 200 was expected.

### How AI Helped
Kiro's final checkpoint task detected and fixed all failing tests by adding appropriate `vi.mock("@/lib/auth")` calls.

### What I Validated
Ran full test suite — 590 tests passing.

### Final Fix
Added `vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: {...} }) }))` to all integration test files.
