# Data Model

## Entity Relationship Diagram

```
User (1) ──→ (many) Project
User (1) ──→ (many) Task
Project (1) ──→ (many) Task [cascade delete]
```

## Models

### User
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | PK, auto-generated |
| email | VARCHAR(255) | Unique, not null |
| name | VARCHAR(100) | Not null |
| hashedPassword | VARCHAR(255) | Not null |
| role | Role enum | Default: Member |
| createdAt | TIMESTAMP | Auto |
| updatedAt | TIMESTAMP | Auto |

### Project
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | PK, auto-generated |
| name | VARCHAR(255) | Not null |
| description | VARCHAR(2000) | Nullable |
| status | ProjectStatus | Default: Planned |
| priority | Priority | Not null |
| startDate | DATE | Nullable |
| dueDate | DATE | Nullable |
| progress | INT | Default: 0 |
| ownerId | UUID | FK → User, nullable, onDelete: SetNull |
| createdAt | TIMESTAMP | Auto |
| updatedAt | TIMESTAMP | Auto |

### Task
| Field | Type | Constraints |
|-------|------|------------|
| id | UUID | PK, auto-generated |
| title | VARCHAR(255) | Not null |
| description | VARCHAR(2000) | Nullable |
| status | TaskStatus | Default: Todo |
| priority | Priority | Not null |
| dueDate | DATE | Nullable |
| assignedTo | VARCHAR(100) | Nullable |
| projectId | UUID | FK → Project, cascade delete |
| createdById | UUID | FK → User, nullable, onDelete: SetNull |
| createdAt | TIMESTAMP | Auto |
| updatedAt | TIMESTAMP | Auto |

## Enums

- **Role:** Admin, Manager, Member
- **ProjectStatus:** Planned, In Progress, Completed, On Hold, Cancelled
- **TaskStatus:** Todo, In Progress, Review, Done
- **Priority:** Low, Medium, High

## Indexes

- `users.email` (unique)
- `projects.ownerId`
- `tasks.projectId`
- `tasks.status`
- `tasks.dueDate`
- `tasks.createdById`
