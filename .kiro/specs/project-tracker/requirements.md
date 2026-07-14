# Requirements Document

## Introduction

The Project Tracker is a modern web application that helps teams plan, organize, and monitor projects and tasks. Built with Next.js 15 (App Router), TypeScript, Material UI, TanStack Query, React Hook Form, Zod, and Prisma ORM backed by PostgreSQL, the application provides a comprehensive dashboard, full CRUD operations for projects and tasks, search and filtering capabilities, and real-time progress tracking.

## Glossary

- **System**: The Project Tracker application as a whole, encompassing frontend and backend
- **API**: The Next.js Route Handlers serving RESTful endpoints under /api
- **Dashboard**: The main overview page displaying aggregated project and task statistics
- **Project**: An entity representing a planned initiative with name, description, status, priority, dates, and progress
- **Task**: An entity representing a unit of work within a project, with title, description, status, priority, due date, and assignee
- **Validator**: The Zod-based validation layer that enforces data integrity on all API inputs
- **Repository**: The Prisma-based data access layer responsible for database operations
- **Project_Status**: One of Planned, In Progress, Completed, On Hold, or Cancelled
- **Task_Status**: One of Todo, In Progress, Review, or Done
- **Priority**: One of Low, Medium, or High
- **Progress**: A percentage value (0–100) representing completion of a project or task set

## Requirements

### Requirement 1: Dashboard Statistics

**User Story:** As a team member, I want to see an overview of all project and task metrics on a dashboard, so that I can quickly assess the health of ongoing work.

#### Acceptance Criteria

1. WHEN a user navigates to the Dashboard, THE System SHALL display the total number of projects as a non-negative integer.
2. WHEN a user navigates to the Dashboard, THE System SHALL display the count of active projects (status is "In Progress") as a non-negative integer.
3. WHEN a user navigates to the Dashboard, THE System SHALL display the count of completed projects (status is "Completed") as a non-negative integer.
4. WHEN a user navigates to the Dashboard, THE System SHALL display the count of overdue tasks (tasks with due date earlier than today's date at midnight in the system's configured timezone and status not "Done") as a non-negative integer.
5. WHEN a user navigates to the Dashboard, THE System SHALL display upcoming deadlines showing task name and due date for tasks due within the next 7 calendar days (inclusive of today), ordered by due date ascending, limited to a maximum of 20 tasks.
6. WHEN a user navigates to the Dashboard, THE System SHALL display the progress overview showing average project progress as a percentage rounded to one decimal place (0.0% when no projects exist).
7. THE API SHALL expose a GET /api/dashboard endpoint that returns all dashboard statistics in a single response within 2 seconds.
8. IF the system fails to retrieve dashboard statistics, THEN THE System SHALL display an error message indicating that dashboard data could not be loaded and offer a retry action.
9. IF there are no projects or tasks in the system, THEN THE System SHALL display all counts as zero and the upcoming deadlines list as empty.

---

### Requirement 2: Project Creation

**User Story:** As a project manager, I want to create new projects with relevant details, so that I can track planned work from inception.

#### Acceptance Criteria

1. WHEN a user submits a valid project creation form, THE API SHALL create a new Project record in the database and return the created project including its unique identifier, name, description, status, priority, startDate, dueDate, progress, createdAt, and updatedAt fields.
2. WHEN a project is created, THE System SHALL set the createdAt and updatedAt timestamps automatically to the current server time.
3. WHEN a project is created without an explicit status, THE System SHALL default the status to "Planned".
4. THE Validator SHALL require the project name field to be present and non-empty after trimming whitespace.
5. THE Validator SHALL reject project names exceeding 100 characters.
6. THE Validator SHALL require the priority field to be one of Low, Medium, or High.
7. IF a project creation request contains a dueDate earlier than the startDate, THEN THE Validator SHALL reject the request with an error message indicating the date constraint violation.
8. THE API SHALL expose a POST /api/projects endpoint for project creation.
9. THE Validator SHALL treat the description, startDate, and dueDate fields as optional, and SHALL reject descriptions exceeding 500 characters.
10. WHEN a project is created, THE System SHALL set the initial progress to 0.

---

### Requirement 3: Project Retrieval

**User Story:** As a team member, I want to view a list of all projects and see individual project details, so that I can understand the current state of work.

#### Acceptance Criteria

1. WHEN a user requests the project list, THE API SHALL return all projects with their identifier, name, description, current status, priority, startDate, dueDate, progress, createdAt, and updatedAt fields.
2. WHEN a user requests a specific project by identifier, THE API SHALL return the full project details including all fields and the list of associated tasks.
3. IF a user requests a project that does not exist, THEN THE API SHALL return a 404 error with a message indicating that no project was found for the given identifier.
4. IF a user requests a project using an invalid identifier format, THEN THE API SHALL return a 400 error with a message indicating the identifier is malformed.
5. THE API SHALL expose a GET /api/projects endpoint for listing all projects.
6. THE API SHALL expose a GET /api/projects/:id endpoint for retrieving a single project.

---

### Requirement 4: Project Update

**User Story:** As a project manager, I want to edit project details, so that I can keep project information accurate as plans evolve.

#### Acceptance Criteria

1. WHEN a user submits a valid project update request, THE API SHALL update the specified Project record with the provided fields and return the complete updated project including all current field values.
2. WHEN a project is updated, THE System SHALL automatically update the updatedAt timestamp.
3. THE Validator SHALL apply the same validation rules for update as for creation (name: 1–100 characters, priority: Low | Medium | High, dueDate not earlier than startDate), but SHALL treat all fields as optional to allow partial updates.
4. IF a project update request targets a non-existent project, THEN THE API SHALL return a 404 error with a descriptive message.
5. THE API SHALL expose a PUT /api/projects/:id endpoint for project updates.
6. IF a project update request fails validation, THEN THE API SHALL return a 400 error response containing field-level error messages without modifying the existing Project record.

---

### Requirement 5: Project Deletion

**User Story:** As a project manager, I want to delete projects that are no longer relevant, so that the project list remains clean and manageable.

#### Acceptance Criteria

1. WHEN a user requests deletion of an existing project, THE API SHALL remove the Project record and all associated Task records from the database in a single atomic operation, ensuring either all records are removed or none are removed.
2. WHEN a project is successfully deleted, THE API SHALL return a 200 status code with a response body containing the identifier of the deleted project.
3. IF a user requests deletion of a non-existent project, THEN THE API SHALL return a 404 error with a message indicating that no project was found for the given identifier.
4. THE API SHALL expose a DELETE /api/projects/:id endpoint for project deletion.
5. IF the provided project ID is not a valid identifier format, THEN THE API SHALL return a 400 error with a message indicating the identifier is invalid.

---

### Requirement 6: Project Status Workflow

**User Story:** As a project manager, I want to transition project status through defined stages, so that I can communicate project state consistently.

#### Acceptance Criteria

1. THE System SHALL restrict Project_Status values to: Planned, In Progress, Completed, On Hold, and Cancelled.
2. THE System SHALL enforce the following allowed status transitions: Planned → In Progress, Planned → Cancelled, In Progress → Completed, In Progress → On Hold, In Progress → Cancelled, On Hold → In Progress, and On Hold → Cancelled.
3. IF a user attempts to update a project status to a value not in the allowed set or via a disallowed transition, THEN THE System SHALL reject the request with an error message indicating the current status, the attempted status, and the list of allowed transitions from the current status.
4. WHEN a project status is changed to "Completed", THE System SHALL set the project progress to 100.
5. WHEN a new project is created, THE System SHALL assign an initial Project_Status of "Planned".

---

### Requirement 7: Task Creation

**User Story:** As a team member, I want to create tasks within a project, so that I can break down project work into manageable units.

#### Acceptance Criteria

1. WHEN a user submits a task creation request that passes all validation rules, THE API SHALL create a new Task record associated with the specified project and return the created task with a system-generated unique identifier and a 201 status code.
2. WHEN a task is created, THE System SHALL set the createdAt and updatedAt timestamps automatically.
3. WHEN a task is created without an explicit status, THE System SHALL default the status to "Todo".
4. THE Validator SHALL require the task title field to be present and contain at least one non-whitespace character.
5. THE Validator SHALL reject task titles exceeding 150 characters.
6. THE Validator SHALL require the priority field to be one of Low, Medium, or High.
7. THE Validator SHALL require the projectId field to reference an existing project.
8. IF a task creation request references a non-existent project, THEN THE API SHALL return a 404 error indicating the project was not found.
9. THE API SHALL expose a POST /api/tasks endpoint for task creation.
10. IF a task creation request fails validation on required fields or field constraints, THEN THE API SHALL return a 400 error with a message indicating which field failed validation.
11. THE Validator SHALL reject a task description exceeding 1000 characters when the description field is provided.

---

### Requirement 8: Task Retrieval

**User Story:** As a team member, I want to view all tasks or a specific task, so that I can understand work assignments and progress.

#### Acceptance Criteria

1. WHEN a user requests the task list, THE API SHALL return all tasks with their identifier, title, current status, priority, due date, project identifier, and assignment information.
2. WHEN a user requests a specific task by identifier, THE API SHALL return the complete task record including identifier, title, description, status, priority, due date, assignee, project identifier, createdAt, and updatedAt fields.
3. IF a user requests a task that does not exist, THEN THE API SHALL return a 404 error with a message indicating that the task was not found.
4. IF a user requests a task using an invalid identifier format, THEN THE API SHALL return a 400 error with a message indicating the identifier is malformed.
5. THE API SHALL expose a GET /api/tasks endpoint for listing all tasks.
6. THE API SHALL expose a GET /api/tasks/:id endpoint for retrieving a single task.

---

### Requirement 9: Task Update

**User Story:** As a team member, I want to edit task details including status, priority, and assignment, so that tasks reflect current reality.

#### Acceptance Criteria

1. WHEN a user submits a task update request with one or more valid fields (title, description, status, priority, dueDate, assignedTo, projectId), THE API SHALL update only the provided fields on the specified Task record and return the full updated task.
2. WHEN a task is updated, THE System SHALL automatically update the updatedAt timestamp.
3. THE Validator SHALL apply validation rules to all fields provided in the update request: title must be non-empty and at most 150 characters, priority must be one of Low, Medium, or High, status must be one of Todo, In Progress, Review, or Done, and projectId must reference an existing project.
4. IF a task update request targets a non-existent task, THEN THE API SHALL return a 404 error with a descriptive message.
5. WHEN a task status is changed to "Done", THE System SHALL recalculate the parent project's progress as the percentage of tasks with status "Done" out of total tasks in that project.
6. THE API SHALL expose a PUT /api/tasks/:id endpoint for task updates.
7. IF a task update request provides a projectId that references a non-existent project, THEN THE API SHALL return a 404 error with a message indicating the project was not found.

---

### Requirement 10: Task Deletion

**User Story:** As a team member, I want to delete tasks that are no longer needed, so that the task list remains relevant.

#### Acceptance Criteria

1. WHEN a user requests deletion of an existing task, THE API SHALL remove the Task record from the database and return a 200 status code with a response body containing the identifier of the deleted task.
2. WHEN a task is successfully deleted, THE System SHALL recalculate the parent project's progress percentage.
3. IF a user requests deletion of a non-existent task, THEN THE API SHALL return a 404 error with a message indicating that no task was found for the given identifier.
4. IF the provided task ID is not a valid identifier format, THEN THE API SHALL return a 400 error with a message indicating the identifier is invalid.
5. THE API SHALL expose a DELETE /api/tasks/:id endpoint for task deletion.

---

### Requirement 11: Task Status Workflow

**User Story:** As a team member, I want to transition task status through defined stages, so that progress is visible and consistent.

#### Acceptance Criteria

1. THE System SHALL restrict Task_Status values to: Todo, In Progress, Review, and Done.
2. THE System SHALL only permit the following status transitions: Todo to In Progress, In Progress to Review, Review to Done, and Review to In Progress.
3. WHEN a task is created, THE System SHALL assign an initial Task_Status of Todo.
4. IF a user attempts to update a task status to a value not in the allowed set, THEN THE System SHALL reject the request with an error message indicating the attempted value and the list of permitted values.
5. IF a user attempts a status transition that is not in the permitted transitions, THEN THE System SHALL reject the request with an error message indicating the current status and the allowed next statuses.

---

### Requirement 12: Task Assignment

**User Story:** As a project manager, I want to assign tasks to team members, so that responsibilities are clear.

#### Acceptance Criteria

1. WHEN a user assigns a task to a team member, THE API SHALL update the assignedTo field on the Task record and return the updated task.
2. WHEN a task assignment is updated, THE System SHALL update the updatedAt timestamp.
3. THE System SHALL allow the assignedTo field to be nullable (unassigned tasks are permitted).
4. THE Validator SHALL accept the assignedTo field as a string value of 1–100 characters when provided.
5. WHEN a user sets assignedTo to null or omits the field, THE System SHALL clear the assignment (unassign the task).

---

### Requirement 13: Search Projects

**User Story:** As a team member, I want to search for projects by name or description, so that I can quickly find specific projects.

#### Acceptance Criteria

1. WHEN a user provides a search query parameter with at least 1 character (after trimming whitespace) on the projects list endpoint, THE API SHALL return projects whose name or description contains the search term as a case-insensitive substring match.
2. WHEN a search query matches no projects, THE API SHALL return an empty list with a 200 status code.
3. THE API SHALL support a "search" query parameter of up to 200 characters on GET /api/projects.
4. IF the search query parameter is empty or contains only whitespace after trimming, THEN THE API SHALL return the unfiltered projects list as if no search parameter was provided.
5. IF the search query parameter exceeds 200 characters, THEN THE API SHALL reject the request with a 400 status code and an error message indicating the search term exceeds the maximum allowed length.

---

### Requirement 14: Search Tasks

**User Story:** As a team member, I want to search for tasks by title or description, so that I can quickly locate specific tasks.

#### Acceptance Criteria

1. WHEN a user provides a search query parameter with at least 1 character (after trimming whitespace) on the tasks list endpoint, THE API SHALL return tasks whose title or description contains the search term as a case-insensitive substring match.
2. WHEN a search query matches no tasks, THE API SHALL return an empty list with a 200 status code.
3. THE API SHALL support a "search" query parameter of up to 200 characters on GET /api/tasks.
4. IF the search query parameter is empty or contains only whitespace after trimming, THEN THE API SHALL return the unfiltered tasks list as if no search parameter was provided.
5. IF the search query parameter exceeds 200 characters, THEN THE API SHALL reject the request with a 400 status code and an error message indicating the search term exceeds the maximum allowed length.

---

### Requirement 15: Filter by Status

**User Story:** As a team member, I want to filter projects and tasks by status, so that I can focus on items in a particular stage.

#### Acceptance Criteria

1. WHEN a user provides a status filter parameter on the projects list endpoint, THE API SHALL return only projects whose status matches the specified value using case-insensitive comparison, where valid values are Planned, In Progress, Completed, On Hold, or Cancelled.
2. WHEN a user provides a status filter parameter on the tasks list endpoint, THE API SHALL return only tasks whose status matches the specified value using case-insensitive comparison, where valid values are Todo, In Progress, Review, or Done.
3. IF a user provides a status filter value that does not match any valid Project_Status value on GET /api/projects, or does not match any valid Task_Status value on GET /api/tasks, THEN THE API SHALL return a 400 error with a message indicating the allowed status values for that endpoint.
4. THE API SHALL support a "status" query parameter on GET /api/projects and GET /api/tasks.
5. WHEN a user provides a status filter that matches no items, THE API SHALL return an empty list with a 200 status code.

---

### Requirement 16: Filter by Priority

**User Story:** As a team member, I want to filter projects and tasks by priority, so that I can focus on high-priority items.

#### Acceptance Criteria

1. WHEN a user provides a priority filter parameter on the projects list endpoint, THE API SHALL return only projects whose priority value exactly matches the specified filter value (case-insensitive comparison against Low, Medium, or High).
2. WHEN a user provides a priority filter parameter on the tasks list endpoint, THE API SHALL return only tasks whose priority value exactly matches the specified filter value (case-insensitive comparison against Low, Medium, or High).
3. IF a user provides an invalid priority filter value (any value other than Low, Medium, or High after case-insensitive comparison), THEN THE API SHALL return a 400 error with a message indicating the valid priority values.
4. THE API SHALL support a "priority" query parameter on GET /api/projects and GET /api/tasks.
5. WHEN a user provides a valid priority filter that matches no projects or tasks, THE API SHALL return an empty list.
6. IF a user provides an empty string as the priority filter parameter value, THEN THE API SHALL return a 400 error with a message indicating the valid priority values.

---

### Requirement 17: Sort by Due Date

**User Story:** As a team member, I want to sort projects and tasks by due date, so that I can prioritize upcoming deadlines.

#### Acceptance Criteria

1. WHEN a user provides a sort parameter with value "dueDate" on the projects list endpoint, THE API SHALL return projects ordered by due date ascending by default.
2. WHEN a user provides a sort parameter with value "dueDate" on the tasks list endpoint, THE API SHALL return tasks ordered by due date ascending by default.
3. THE API SHALL support a "sortBy" query parameter on GET /api/projects and GET /api/tasks.
4. THE API SHALL support a "sortOrder" query parameter with values "asc" or "desc" (default "asc").
5. WHEN sorting by due date, entities with null or missing dueDate SHALL appear last in ascending order and first in descending order.
6. IF a user provides an invalid sortBy value, THEN THE API SHALL return a 400 error with a message indicating the valid sort fields.
7. IF a user provides an invalid sortOrder value, THEN THE API SHALL return a 400 error with a message indicating the valid sort order values ("asc" or "desc").

---

### Requirement 18: Progress Tracking

**User Story:** As a project manager, I want to see project progress as a percentage based on task completion, so that I can monitor overall project health.

#### Acceptance Criteria

1. THE System SHALL calculate project progress as the number of tasks with status "Done" divided by the total number of tasks in the project, expressed as an integer percentage from 0 to 100, rounded down to the nearest whole number.
2. IF a project has zero tasks, THEN THE System SHALL report progress as 0 percent.
3. WHEN a task status changes, THE System SHALL recalculate the parent project's progress percentage and return the updated value in the response to that status change operation.
4. THE API SHALL include the progress field as a numeric integer value (0 to 100) in all project response objects that include project details.
5. THE System SHALL count only tasks directly belonging to the project (excluding deleted or archived tasks) when calculating total tasks for the progress percentage.

---

### Requirement 19: Input Validation

**User Story:** As a developer, I want all API inputs validated with Zod schemas, so that invalid data never reaches the database.

#### Acceptance Criteria

1. THE Validator SHALL use Zod schemas to validate all incoming request bodies on POST, PUT, and PATCH endpoints.
2. WHEN validation fails, THE API SHALL return a 400 error response containing an error entry for each field that failed validation, where each entry identifies the field path and the reason for rejection.
3. THE Validator SHALL sanitize string inputs by trimming leading and trailing whitespace.
4. THE Validator SHALL reject requests with unexpected or unknown fields not defined in the endpoint's Zod schema and return a 400 error response identifying the unrecognized fields.
5. THE Validator SHALL ensure that for any valid data object, parsing it through the Zod schema and serializing the result produces a deeply equal object after accounting for schema-defined transforms such as whitespace trimming.
6. IF a request body is missing, empty, or contains malformed JSON that cannot be parsed, THEN THE API SHALL return a 400 error response indicating that the request body is invalid or missing without attempting further field-level validation.

---

### Requirement 20: Error Handling

**User Story:** As a developer, I want consistent and informative error responses, so that frontend consumers can display appropriate feedback.

#### Acceptance Criteria

1. WHEN an unhandled error occurs, THE API SHALL return a 500 error response with a fixed generic message that does not expose stack traces, file paths, database connection strings, or library-specific error details.
2. THE API SHALL use a consistent JSON error response format containing "error" (string: error type) and "message" (string: human-readable description) fields across all error responses on all endpoints.
3. WHEN a database operation fails due to a constraint violation, THE API SHALL return a 409 conflict error with a message indicating which resource or field caused the conflict, without exposing internal schema or table names.
4. WHEN a request fails input validation, THE API SHALL return a 400 error response with a message identifying the field(s) that failed validation and the reason for each failure.
5. WHEN a requested resource is not found, THE API SHALL return a 404 error response with a message indicating the type of resource that was not found.

---

### Requirement 21: Data Persistence

**User Story:** As a developer, I want data persisted reliably in PostgreSQL via Prisma ORM, so that data survives application restarts and scales with the team.

#### Acceptance Criteria

1. THE Repository SHALL use Prisma ORM for all database read and write operations.
2. THE System SHALL define a Project model in the Prisma schema containing at minimum: id (UUID), name (string, max 255 characters), description (string, max 2000 characters), createdAt (timestamp), and updatedAt (timestamp).
3. THE System SHALL define a Task model in the Prisma schema containing at minimum: id (UUID), title (string, max 255 characters), description (string, max 2000 characters), status (enum), projectId (UUID foreign key), createdAt (timestamp), and updatedAt (timestamp).
4. THE System SHALL enforce a foreign key relationship between Task.projectId and Project.id with cascading delete, so that deleting a Project removes all associated Tasks.
5. THE System SHALL use database-generated UUIDs for all entity identifiers.
6. IF a database write operation violates a schema constraint, THEN THE System SHALL reject the operation and return an error indicating the nature of the violation without persisting partial data.
7. THE System SHALL maintain a Prisma migration history so that schema changes are versioned and reproducible across environments.

---

### Requirement 22: Frontend Data Fetching

**User Story:** As a user, I want the UI to load data efficiently and stay in sync with the server, so that I always see current information without manual refreshes.

#### Acceptance Criteria

1. THE System SHALL use TanStack Query for all server state management in the frontend.
2. WHEN a mutation (create, update, delete) succeeds, THE System SHALL invalidate all cached queries whose data includes the mutated resource type to trigger a data refresh.
3. WHILE data is loading, THE System SHALL display a loading indicator within 200 milliseconds of the fetch request initiating.
4. IF a data fetch fails after the configured retry attempts, THEN THE System SHALL display an error message indicating the nature of the failure and provide a manual retry option.
5. IF a data fetch fails, THEN THE System SHALL retry the request up to 3 times with exponential backoff before displaying an error to the user.
6. WHEN a query's cached data becomes stale, THE System SHALL refetch the data in the background upon the next window focus or component mount without requiring user interaction.

---

### Requirement 23: Frontend Form Handling

**User Story:** As a user, I want forms that validate input before submission and show clear error messages, so that I can correct mistakes without server round-trips.

#### Acceptance Criteria

1. THE System SHALL use React Hook Form integrated with Zod resolvers for all create and edit forms.
2. WHEN a user submits a form with invalid data, THE System SHALL display a validation error message below each invalid field, identifying the validation rule that failed, without submitting the request to the server.
3. WHEN a form submission succeeds, THE System SHALL navigate the user back to the list view for the entity type that was created or edited, or to the detail view of the entity that was edited.
4. WHEN the user opens an edit form, THE System SHALL pre-populate all editable fields with the current stored values for that entity before the form becomes interactive.
5. IF a server-side submission fails after client-side validation passes, THEN THE System SHALL display an error message indicating the failure reason and preserve the user's entered data in the form.
6. WHILE a form submission is in progress, THE System SHALL disable the submit button to prevent duplicate submissions.
7. WHEN a user corrects an invalid field, THE System SHALL remove the validation error message for that field within 1 second of the field value becoming valid.

---

### Requirement 24: Responsive UI Design

**User Story:** As a user, I want the application to be usable on desktop and tablet screens, so that I can manage projects from different devices.

#### Acceptance Criteria

1. THE System SHALL use Material UI components as the component library for all UI elements.
2. THE System SHALL render all page content without horizontal scrolling and with all interactive elements visible and operable at any screen width from 768px to 1920px.
3. THE System SHALL provide form controls with visible text labels and ARIA attributes that conform to WCAG 2.1 Level AA success criteria 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value).
4. WHILE the viewport width is less than 1024px, THE System SHALL render all interactive elements (buttons, links, form inputs) with a minimum touch target size of 44x44 CSS pixels.

---

### Requirement 25: Application Architecture

**User Story:** As a developer, I want a well-organized codebase following scalable enterprise patterns, so that the application is maintainable and extensible.

#### Acceptance Criteria

1. THE System SHALL organize code into the following directory structure: app/ (pages and API routes), components/ (shared UI components), features/ (feature-specific modules), services/ (business logic), repositories/ (data access), validators/ (Zod schemas), prisma/ (schema and migrations), lib/ (shared utilities), hooks/ (custom React hooks), utils/ (helper functions), types/ (TypeScript type definitions), tests/ (test files).
2. THE System SHALL enforce layer separation such that API route handlers delegate business logic to the service layer, the service layer delegates data access to the repository layer, and the repository layer is the only layer that performs direct database queries or ORM calls.
3. THE System SHALL use TypeScript strict mode across the entire codebase with the `strict` flag set to `true` in tsconfig.json.
4. THE System SHALL enforce that validators/ modules are invoked by the API route handler layer before passing data to the service layer, and that no raw unvalidated input reaches the service or repository layers.
5. THE System SHALL enforce a unidirectional dependency flow where route handlers may import from services, validators, and types; services may import from repositories, validators, and types; and repositories may import only from prisma, lib, utils, and types.
