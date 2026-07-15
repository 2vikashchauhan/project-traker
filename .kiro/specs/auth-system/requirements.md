# Requirements Document

## Introduction

This feature adds authentication and role-based access control to the Project Tracker application. It uses NextAuth.js (Auth.js v5) with a credentials provider for email/password login, JWT-based session management, and a three-tier role system (Admin, Manager, Member). All existing projects and tasks remain accessible to all authenticated users. No social OAuth providers are included.

## Glossary

- **Auth_System**: The authentication and authorization subsystem built on NextAuth.js (Auth.js v5) integrated into the Next.js application
- **User**: A registered person with an email, hashed password, name, and assigned role stored in the database
- **Session**: A JWT-based token managed by NextAuth.js that represents an authenticated user's active context
- **Role**: One of three access levels assigned to a User — Admin, Manager, or Member
- **Admin**: A Role granting full access to all resources including user management capabilities
- **Manager**: A Role granting ability to manage all projects and tasks but not user accounts
- **Member**: A Role granting ability to manage only projects and tasks owned by or assigned to the User
- **Credentials_Provider**: The NextAuth.js provider that authenticates users via email and password
- **Auth_Middleware**: Next.js middleware that intercepts requests and validates sessions before allowing access to protected routes
- **Protected_Route**: Any application route that requires a valid Session to access
- **Registration_Handler**: The API endpoint responsible for creating new User accounts
- **User_Management_Panel**: The Admin-only interface for listing users and modifying their roles

## Requirements

### Requirement 1: User Registration

**User Story:** As a visitor, I want to register an account with my email and password, so that I can access the Project Tracker application.

#### Acceptance Criteria

1. WHEN a visitor submits a valid email, password, and name to the Registration_Handler, THE Auth_System SHALL create a new User record with the Member role and return a success response.
2. THE Auth_System SHALL hash the password using bcrypt with a minimum cost factor of 10 before storing it in the database.
3. WHEN a visitor submits a registration request with an email that already exists in the database, THE Auth_System SHALL return a 409 Conflict error with a message indicating the email is already registered.
4. WHEN a visitor submits a registration request with an invalid email format, THE Auth_System SHALL return a 400 Validation error specifying the email field is invalid.
5. WHEN a visitor submits a registration request with a password shorter than 8 characters, THE Auth_System SHALL return a 400 Validation error specifying the password does not meet minimum length requirements.
6. THE Auth_System SHALL validate that the name field is present and between 1 and 100 characters in length.

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my projects and tasks.

#### Acceptance Criteria

1. WHEN a User submits valid email and password credentials to the Credentials_Provider, THE Auth_System SHALL authenticate the User and create a Session.
2. WHEN a User submits an email that does not exist in the database, THE Auth_System SHALL return an authentication failure without revealing whether the email or password was incorrect.
3. WHEN a User submits an incorrect password for an existing email, THE Auth_System SHALL return an authentication failure without revealing whether the email or password was incorrect.
4. WHEN authentication succeeds, THE Auth_System SHALL issue a JWT-based Session cookie containing the User id, email, name, and role.

### Requirement 3: Session Management

**User Story:** As an authenticated user, I want my session to persist across page navigations, so that I do not need to log in repeatedly.

#### Acceptance Criteria

1. THE Auth_System SHALL use the JWT session strategy provided by NextAuth.js for session persistence.
2. WHEN a User's Session expires, THE Auth_System SHALL redirect the User to the login page.
3. WHEN a User triggers a logout action, THE Auth_System SHALL invalidate the Session and redirect the User to the login page.
4. THE Auth_System SHALL include the User's id, email, name, and role in the Session token payload.

### Requirement 4: Backend Route Protection

**User Story:** As the system owner, I want all API routes protected by authentication, so that unauthenticated requests cannot access or modify data.

#### Acceptance Criteria

1. WHEN an unauthenticated request is made to any API route under /api/projects, /api/tasks, or /api/dashboard, THE Auth_Middleware SHALL return a 401 Unauthorized response.
2. WHEN an authenticated request is made to a Protected_Route, THE Auth_Middleware SHALL allow the request to proceed to the route handler.
3. THE Auth_System SHALL exclude the /api/auth routes and the Registration_Handler from authentication enforcement to allow login and registration.

### Requirement 5: Frontend Route Protection

**User Story:** As the system owner, I want unauthenticated users redirected to the login page, so that application content is only visible to logged-in users.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any page other than /login or /register, THE Auth_System SHALL redirect the user to the /login page.
2. WHEN an authenticated user navigates to /login or /register, THE Auth_System SHALL redirect the user to the dashboard page.
3. WHILE a user's authentication status is being determined, THE Auth_System SHALL display a loading indicator instead of page content.

### Requirement 6: Role-Based Access Control

**User Story:** As the system owner, I want users to have different permission levels, so that sensitive operations are restricted to authorized roles.

#### Acceptance Criteria

1. WHILE a User has the Admin role, THE Auth_System SHALL grant access to all projects, all tasks, and the User_Management_Panel.
2. WHILE a User has the Manager role, THE Auth_System SHALL grant access to create, read, update, and delete all projects and all tasks.
3. WHILE a User has the Member role, THE Auth_System SHALL grant access to read all projects and all tasks.
4. WHILE a User has the Member role, THE Auth_System SHALL grant access to create, update, and delete only projects and tasks owned by or assigned to that User.
5. WHEN a User with the Member role attempts to modify a project or task not owned by or assigned to that User, THE Auth_System SHALL return a 403 Forbidden response.
6. WHEN a User with the Manager role attempts to access the User_Management_Panel, THE Auth_System SHALL return a 403 Forbidden response.

### Requirement 7: User Profile

**User Story:** As an authenticated user, I want to view and update my name, so that my profile information stays current.

#### Acceptance Criteria

1. WHEN an authenticated User requests their profile, THE Auth_System SHALL return the User's id, email, name, and role.
2. WHEN an authenticated User submits a valid name update, THE Auth_System SHALL update the User's name in the database and return the updated profile.
3. THE Auth_System SHALL validate that the updated name is between 1 and 100 characters in length.
4. THE Auth_System SHALL prevent Users from modifying their own email or role through the profile endpoint.

### Requirement 8: Database Schema

**User Story:** As a developer, I want a User model with role support and relations to existing models, so that authentication data integrates with the existing schema.

#### Acceptance Criteria

1. THE Auth_System SHALL store Users in a database table with columns for id (UUID), email (unique), name, hashed password, role, createdAt, and updatedAt.
2. THE Auth_System SHALL define a Role enum with values Admin, Manager, and Member, with Member as the default.
3. THE Auth_System SHALL add an optional ownerId foreign key to the Project model referencing the User model.
4. THE Auth_System SHALL add an optional createdById foreign key to the Task model referencing the User model.
5. THE Auth_System SHALL set the ownerId and createdById fields to nullable so that existing projects and tasks without an owner remain valid.
6. WHEN a User is deleted, THE Auth_System SHALL set the ownerId on related Projects and createdById on related Tasks to null rather than cascading deletion.

### Requirement 9: Frontend Authentication Pages

**User Story:** As a visitor, I want login and registration pages, so that I can authenticate with the application.

#### Acceptance Criteria

1. THE Auth_System SHALL provide a /login page with email and password input fields and a submit button.
2. THE Auth_System SHALL provide a /register page with name, email, password, and confirm password input fields and a submit button.
3. WHEN a user submits the registration form with a confirm password that does not match the password, THE Auth_System SHALL display a client-side validation error without making an API request.
4. WHEN authentication fails on the login page, THE Auth_System SHALL display an error message stating that credentials are invalid.
5. WHEN registration fails due to a duplicate email, THE Auth_System SHALL display an error message stating the email is already in use.
6. THE Auth_System SHALL provide a navigation link from the login page to the registration page and from the registration page to the login page.
7. THE Auth_System SHALL render the login and registration pages without the AppShell sidebar and header.

### Requirement 10: Security

**User Story:** As the system owner, I want secure authentication practices, so that user accounts and data are protected from common attacks.

#### Acceptance Criteria

1. THE Auth_System SHALL store passwords hashed with bcrypt and a minimum cost factor of 10.
2. THE Auth_System SHALL rely on NextAuth.js built-in CSRF protection for all authentication endpoints.
3. THE Auth_System SHALL set the Session cookie with HttpOnly, Secure (in production), and SameSite=Lax attributes.
4. THE Auth_System SHALL exclude the plaintext password from all API responses, Session tokens, and client-accessible data.
5. IF a JWT token fails signature verification, THEN THE Auth_System SHALL reject the request and return a 401 Unauthorized response.
6. THE Auth_System SHALL enforce a maximum password length of 128 characters to prevent bcrypt denial-of-service via oversized inputs.

### Requirement 11: Admin User Management

**User Story:** As an Admin, I want to view all users and change their roles, so that I can manage access levels across the organization.

#### Acceptance Criteria

1. WHEN an Admin requests the user list, THE Auth_System SHALL return a list of all Users with their id, email, name, role, and createdAt fields.
2. WHEN an Admin submits a role change for a User, THE Auth_System SHALL update that User's role in the database and return the updated User record.
3. THE Auth_System SHALL prevent an Admin from changing their own role to avoid accidental lock-out.
4. WHEN a non-Admin User attempts to access the user list or change a User's role, THE Auth_System SHALL return a 403 Forbidden response.
5. THE Auth_System SHALL provide a /admin/users page accessible only to Users with the Admin role, displaying the user list with role-editing controls.
