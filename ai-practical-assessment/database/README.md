# Database Documentation

## Database: PostgreSQL

### Schema Overview

The application uses PostgreSQL with Prisma ORM. Three models: User, Project, Task.

### Entity Relationship

```
User (1) ──────< Project (1) ──────< Task (many)
  │                                      │
  └──────────────────────────────────────┘
         (createdBy relationship)
```

### Models

#### User
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | Primary key, auto-generated |
| email | VARCHAR(255) | Unique, required |
| name | VARCHAR(100) | Required |
| hashedPassword | VARCHAR(255) | Required, never exposed in API |
| role | Enum(Admin, Manager, Member) | Default: Member |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-updated |

#### Project
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | Primary key, auto-generated |
| name | VARCHAR(255) | Required, 1-100 chars validated |
| description | VARCHAR(2000) | Optional, max 500 chars validated |
| status | Enum | Default: Planned |
| priority | Enum(Low, Medium, High) | Required |
| startDate | Date | Optional |
| dueDate | Date | Optional, must be >= startDate |
| progress | Integer | 0-100, auto-calculated |
| ownerId | UUID | FK → User, nullable (legacy support) |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-updated |

#### Task
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | Primary key, auto-generated |
| title | VARCHAR(255) | Required, 1-150 chars validated |
| description | VARCHAR(2000) | Optional, max 1000 chars validated |
| status | Enum | Default: Todo |
| priority | Enum(Low, Medium, High) | Required |
| dueDate | Date | Optional |
| assignedTo | VARCHAR(100) | Optional |
| projectId | UUID | FK → Project, cascade delete |
| createdById | UUID | FK → User, nullable (legacy support) |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-updated |

### Status Enums

**ProjectStatus:** Planned, In Progress, Completed, On Hold, Cancelled

**TaskStatus:** Todo, In Progress, Review, Done

**Priority:** Low, Medium, High

**Role:** Admin, Manager, Member

### Setup Commands

```bash
# Create database
sudo -u postgres createdb project_tracker

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Reset database (destructive)
npx prisma migrate reset
```

### Prisma Schema Location

`prisma/schema.prisma` — defines all models, enums, relations, and indexes.

### Indexes

- `projects.ownerId` — Fast lookup by owner
- `tasks.projectId` — Fast lookup by project
- `tasks.status` — Fast filtering by status
- `tasks.dueDate` — Fast sorting/filtering by due date
- `tasks.createdById` — Fast lookup by creator
- `users.email` — Unique constraint (implicit index)
