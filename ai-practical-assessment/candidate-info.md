# Candidate Information

**Name:** Vikash
**Role:** Full Stack Developer
**Primary Technology Stack:** Next.js 15, TypeScript, PostgreSQL, Prisma ORM

**Primary AI Tool Used:** Kiro (AI-powered IDE built on VS Code)
**Project Option Selected:** Project Tracker with Authentication & Authorization

**Assessment Start Date:** July 14, 2026
**Submission Date:** July 15, 2026

## Project Summary

Built a full-stack **Project Tracker** application with complete authentication and role-based access control. The application enables teams to plan, organize, and monitor projects and tasks through dashboards, CRUD operations, search/filtering, progress tracking, and user management.

Key capabilities:
- Dashboard with real-time project/task statistics
- Full CRUD for projects and tasks with status workflow enforcement
- Authentication (email/password via NextAuth.js v5 with JWT sessions)
- Role-Based Access Control (Admin/Manager/Member)
- Property-based testing with 590 passing tests

## Tools Used

| Tool | Purpose |
|------|---------|
| Kiro IDE | AI-powered development environment (spec-driven workflow) |
| Next.js 15 | Full-stack React framework (App Router) |
| TypeScript 5.7 | Type safety |
| Prisma 6.2 | Database ORM |
| PostgreSQL | Relational database |
| NextAuth.js v5 | Authentication |
| Material UI 6 | Component library |
| TanStack Query 5 | Server-state management |
| React Hook Form + Zod | Form validation |
| Vitest + fast-check | Testing (unit, integration, property-based) |

## Setup Summary

1. Clone repository
2. `npm install`
3. Set up PostgreSQL database
4. Copy `.env.example` to `.env.local` with DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL
5. `npx prisma migrate deploy`
6. `npm run dev` (http://localhost:3000)
7. Register a user at /register, promote to Admin via DB
