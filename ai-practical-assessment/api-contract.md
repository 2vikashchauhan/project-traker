# API Contract

## Authentication

### Endpoint: POST /api/auth/register
**Purpose:** Register a new user account

#### Request
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

#### Response (201 Created)
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "Member",
  "createdAt": "2026-07-15T00:00:00.000Z"
}
```

#### Validation Rules
- email: valid email format, unique
- password: 8-128 characters
- name: 1-100 characters, trimmed

#### Error Responses
- 400: `{ "error": "ValidationError", "message": "...", "fieldErrors": [...] }`
- 409: `{ "error": "ConflictError", "message": "A user with this email already exists" }`

---

### Endpoint: GET /api/users/me
**Purpose:** Get current user profile (requires auth)

#### Response (200)
```json
{ "id": "uuid", "email": "user@example.com", "name": "John Doe", "role": "Member" }
```

---

### Endpoint: PATCH /api/users/me
**Purpose:** Update current user profile (requires auth)

#### Request
```json
{ "name": "New Name" }
```

---

### Endpoint: GET /api/admin/users
**Purpose:** List all users (requires Admin role)

---

### Endpoint: PATCH /api/admin/users/:id
**Purpose:** Change user role (requires Admin role)

#### Request
```json
{ "role": "Manager" }
```

---

## Projects

### Endpoint: GET /api/projects
**Purpose:** List projects with optional filters

#### Query Parameters
- search: string (case-insensitive name/description search)
- status: ProjectStatus enum
- priority: Priority enum
- sortBy: "dueDate" | "createdAt" | "name"
- sortOrder: "asc" | "desc"

### Endpoint: POST /api/projects
**Purpose:** Create a new project (requires auth)

#### Request
```json
{
  "name": "Project Name",
  "description": "Optional description",
  "priority": "High",
  "startDate": "2026-07-15",
  "dueDate": "2026-08-15"
}
```

### Endpoint: GET /api/projects/:id
### Endpoint: PUT /api/projects/:id
### Endpoint: DELETE /api/projects/:id

---

## Tasks

### Endpoint: GET /api/tasks
### Endpoint: POST /api/tasks
### Endpoint: GET /api/tasks/:id
### Endpoint: PUT /api/tasks/:id
### Endpoint: DELETE /api/tasks/:id

---

## Dashboard

### Endpoint: GET /api/dashboard
**Purpose:** Aggregated statistics

#### Response (200)
```json
{
  "totalProjects": 10,
  "totalTasks": 45,
  "projectsByStatus": { "Planned": 3, "In Progress": 5, "Completed": 2, "On Hold": 0, "Cancelled": 0 },
  "tasksByStatus": { "Todo": 10, "In Progress": 20, "In Review": 5, "Done": 10 },
  "averageProgress": 55.5,
  "upcomingDeadlines": [{ "id": "...", "title": "...", "dueDate": "...", "project": {} }]
}
```

---

## Common Error Responses

| Status | Error Type | When |
|--------|-----------|------|
| 400 | ValidationError | Invalid input |
| 401 | UnauthorizedError | No valid session |
| 403 | ForbiddenError | Insufficient permissions |
| 404 | NotFoundError | Resource not found |
| 409 | ConflictError | Duplicate resource |
| 500 | InternalError | Unhandled server error |
