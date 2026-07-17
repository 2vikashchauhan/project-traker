# Acceptance Criteria

## Core
- [x] Dashboard displays total projects, active projects, completed projects, overdue tasks
- [x] Dashboard displays upcoming deadlines (next 7 days, max 20 tasks)
- [x] Projects can be created, read, updated, deleted
- [x] Tasks can be created, read, updated, deleted
- [x] Tasks are linked to projects (cascade delete)
- [x] Status transitions are enforced (invalid transitions return error)
- [x] Progress auto-calculates from task completion

## Authentication
- [x] Users can register with email, password, name
- [x] Users can log in with email/password
- [x] JWT session persists across page navigation
- [x] Login/register pages redirect authenticated users to dashboard
- [x] Protected routes redirect unauthenticated users to login

## Authorization
- [x] Admin has full access to all resources
- [x] Manager can CRUD all projects and tasks
- [x] Member can read all, but only modify owned resources
- [x] Admin can list all users and change roles
- [x] Admin cannot change their own role
- [x] Non-admin receives 403 on admin endpoints

## Validation
- [x] Project name: 1-100 chars, required, trimmed
- [x] Task title: 1-150 chars, required, trimmed
- [x] Password: 8-128 chars
- [x] Email: valid format required
- [x] Unknown fields rejected (strict schemas)
- [x] Due date must be >= start date

## Error Handling
- [x] 400 ValidationError with field-level errors
- [x] 401 UnauthorizedError for missing authentication
- [x] 403 ForbiddenError for insufficient permissions
- [x] 404 NotFoundError for missing resources
- [x] 409 ConflictError for duplicate emails
- [x] 500 InternalError for unhandled errors (no internals exposed)

## Testing
- [x] Unit tests for all services and validators
- [x] Integration tests for all API routes
- [x] Property-based tests for correctness properties (14 properties, 100+ runs each)
- [x] 590 total tests passing

## Documentation
- [x] Requirements document with EARS-format acceptance criteria
- [x] Design document with architecture diagrams
- [x] Implementation plan with dependency graph
- [x] Prompt history documenting all AI interactions
