# Prompt History — Project Tracker

This document records the prompts and interactions used during the spec-driven development of the Project Tracker application.

---

## Prompt 1: Initial Feature Request

**Date:** July 14, 2026  
**Type:** Feature Spec Creation

**Prompt:**

> Build a modern **Project Tracker** application that helps teams plan, organize, and monitor projects and tasks. The application should provide dashboards, project management, task tracking, search, filtering, progress monitoring, and reporting.
>
> **Technology Stack:**
> - Frontend: Next.js 15 (App Router), TypeScript, Material UI (MUI), TanStack Query, React Hook Form, Zod, Axios
> - Backend: Next.js Route Handlers (app/api), Prisma ORM
> - Database: PostgreSQL
>
> **Entities:**
> - Project: id, name, description, status, priority, startDate, dueDate, progress, createdAt, updatedAt
> - Task: id, projectId, title, description, status, priority, dueDate, assignedTo, createdAt, updatedAt
>
> **Features:** Dashboard (Total Projects, Active Projects, Completed Projects, Overdue Tasks, Upcoming Deadlines, Progress Overview), Project Management (CRUD), Task Management (CRUD + Assign + Status + Priority), Search & Filters (by status, priority, due date), Progress Tracking (project and task completion percentages)
>
> **Status Workflow:**
> - Project: Planned → In Progress → Completed / On Hold / Cancelled
> - Task: Todo → In Progress → Review → Done
>
> **Validation:** Zod for all APIs. Project name max 100 chars, task title max 150 chars, due date >= start date, priority: Low/Medium/High.
>
> **API Endpoints:** RESTful CRUD for projects and tasks, plus GET /api/dashboard.
>
> **Testing:** Integration tests for CRUD, search, filters, dashboard stats, validation, progress calculation.
>
> Generate Kiro spec files (requirements.md, design.md, tasks.md) following spec-driven development methodology. Do NOT generate application code until specifications are approved.

**Outcome:** Spec type selected as "Build a Feature", workflow selected as "Requirements-First".

---

## Prompt 2: Spec Type Selection

**Date:** July 14, 2026  
**Type:** Workflow Decision

**User Choice:** Build a Feature

**Outcome:** Proceeded to workflow selection.

---

## Prompt 3: Workflow Selection

**Date:** July 14, 2026  
**Type:** Workflow Decision

**User Choice:** Requirements-First

**Outcome:** Started generating requirements.md with 25 detailed requirements covering dashboard, project/task CRUD, status workflows, search & filtering, progress tracking, validation, error handling, data persistence, frontend patterns, responsive UI, and architecture.

---

## Prompt 4: Requirements Detailing

**Date:** July 14, 2026  
**Type:** Automatic Refinement

**Action:** Each of the 25 requirements was automatically refined with:
- More precise acceptance criteria
- Explicit HTTP status codes
- Edge case handling
- Measurable behavior specifications
- EARS format compliance (WHERE, WHILE, WHEN, IF, THEN, THE, SHALL)

**Outcome:** requirements.md updated with detailed, testable acceptance criteria for all 25 requirements.

---

## Prompt 5: Design Document Generation

**Date:** July 14, 2026  
**Type:** Design Creation

**Prompt:**

> Create the design for project-tracker

**Outcome:** Generated design.md covering:
- System Architecture (layered monorepo)
- Folder Structure (enterprise-scale organization)
- API Design (full request/response TypeScript schemas)
- Database Schema (Prisma models + ER diagram)
- Component Hierarchy (React component tree)
- Data Flow (sequence diagrams)
- Status Transition Maps
- Error Handling Strategy (custom error classes)
- 13 Correctness Properties for property-based testing
- Testing Strategy (Vitest + fast-check)

---

## Prompt 6: Prompt History Documentation

**Date:** July 14, 2026  
**Type:** Documentation

**Prompt:**

> please create md file that store all prompt history

**Outcome:** Created this prompt-history.md file.

---

## Summary

| Step | Action | Output |
|------|--------|--------|
| 1 | Initial request | Feature scope defined |
| 2 | Spec type selection | "Build a Feature" |
| 3 | Workflow selection | "Requirements-First" |
| 4 | Requirements generation | requirements.md (25 requirements) |
| 5 | Requirements detailing | Refined acceptance criteria |
| 6 | Design generation | design.md (architecture, APIs, schemas, properties) |
| 7 | Prompt history | prompt-history.md |

---

## Next Steps

- [ ] Review and approve requirements.md
- [ ] Review and approve design.md
- [ ] Generate tasks.md (implementation task list)
- [ ] Begin implementation following task list
