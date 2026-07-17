# UI Flow

## Route Structure

```
/ (root)
├── /login                    → Login page (public)
├── /register                 → Registration page (public)
├── /                         → Dashboard (protected)
├── /projects                 → Project list (protected)
├── /projects/new             → Create project (protected)
├── /projects/:id             → Project detail (protected)
├── /projects/:id/edit        → Edit project (protected)
├── /tasks                    → Task list (protected)
├── /tasks/new                → Create task (protected)
├── /tasks/:id                → Task detail (protected)
├── /tasks/:id/edit           → Edit task (protected)
└── /admin/users              → User management (admin only)
```

## Authentication Flow

```
Unauthenticated user → Any protected page
    ↓ (middleware redirect)
/login page
    ↓ (submit credentials)
NextAuth.js signIn("credentials", {...})
    ↓ (success)
Redirect to / (dashboard)
    ↓ (failure)
Show "Invalid email or password" (generic error)
```

## Registration Flow

```
/register page
    ↓ (submit form)
POST /api/auth/register
    ↓ (201 success)
Auto signIn("credentials", {...})
    ↓ (success)
Redirect to / (dashboard)
    ↓ (409 error)
Show "Email already in use"
```

## Protected Page Layout

```
┌──────────────────────────────────────────┐
│ Header [Menu] [Title]        [User Menu] │
├──────┬───────────────────────────────────┤
│      │                                   │
│ Side │         Page Content              │
│ bar  │                                   │
│      │                                   │
│ Nav  │                                   │
│      │                                   │
└──────┴───────────────────────────────────┘
```

## User Menu Dropdown
- User name
- User role
- Divider
- Sign Out → redirect to /login
