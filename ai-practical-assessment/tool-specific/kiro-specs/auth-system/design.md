# Design Document: Auth System

## Architecture Overview

The authentication system integrates into the existing layered architecture as a cross-cutting concern:

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Middleware                         │
│              (Route protection + JWT validation)              │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer                                              │
│  ├── SessionProvider (wraps app)                             │
│  ├── AuthGuard (protects page layouts)                       │
│  ├── /login, /register (public pages)                        │
│  └── /admin/users (admin-only page)                          │
├─────────────────────────────────────────────────────────────┤
│  API Route Handlers                                          │
│  ├── /api/auth/[...nextauth] (NextAuth.js handler)           │
│  ├── /api/auth/register (custom registration)                │
│  ├── /api/users/me (profile)                                 │
│  └── /api/admin/users (user management)                      │
├─────────────────────────────────────────────────────────────┤
│  Auth Middleware (withAuth, withRole)                         │
│  ├── Extracts session from JWT                               │
│  ├── Injects user context into handlers                      │
│  └── Enforces role-based access                              │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                              │
│  ├── auth.service.ts (register, validate credentials)        │
│  └── user.service.ts (profile, admin user management)        │
├─────────────────────────────────────────────────────────────┤
│  Repositories Layer                                          │
│  └── user.repository.ts (User CRUD via Prisma)               │
├─────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL via Prisma)                             │
│  └── User model + Role enum + relations                      │
└─────────────────────────────────────────────────────────────┘
```


The auth layer wraps existing route handlers with `withAuth` (session requirement) and `withRole` (permission check) higher-order functions that compose with the existing `withErrorHandling` wrapper.

## NextAuth.js Configuration

### Core Configuration (`lib/auth.ts`)

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { userRepository } from "@/repositories/user.repository";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await userRepository.findByEmail(
          credentials.email as string
        );
        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.hashedPassword
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
```


### Route Handler (`app/api/auth/[...nextauth]/route.ts`)

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### Type Augmentation (`types/next-auth.d.ts`)

```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
```

## Database Schema Changes

### New Role Enum and User Model

```prisma
enum Role {
  Admin
  Manager
  Member
}

model User {
  id             String    @id @default(uuid()) @db.Uuid
  email          String    @unique @db.VarChar(255)
  name           String    @db.VarChar(100)
  hashedPassword String    @db.VarChar(255)
  role           Role      @default(Member)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  projects       Project[]
  tasks          Task[]

  @@map("users")
}
```


### Modified Project Model

```prisma
model Project {
  id          String        @id @default(uuid()) @db.Uuid
  name        String        @db.VarChar(255)
  description String?       @db.VarChar(2000)
  status      ProjectStatus @default(Planned)
  priority    Priority
  startDate   DateTime?     @db.Date
  dueDate     DateTime?     @db.Date
  progress    Int           @default(0)
  ownerId     String?       @db.Uuid
  owner       User?         @relation(fields: [ownerId], references: [id], onDelete: SetNull)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  tasks       Task[]

  @@index([ownerId])
  @@map("projects")
}
```

### Modified Task Model

```prisma
model Task {
  id          String     @id @default(uuid()) @db.Uuid
  title       String     @db.VarChar(255)
  description String?    @db.VarChar(2000)
  status      TaskStatus @default(Todo)
  priority    Priority
  dueDate     DateTime?  @db.Date
  assignedTo  String?    @db.VarChar(100)
  projectId   String     @db.Uuid
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdById String?    @db.Uuid
  createdBy   User?      @relation(fields: [createdById], references: [id], onDelete: SetNull)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([projectId])
  @@index([status])
  @@index([dueDate])
  @@index([createdById])
  @@map("tasks")
}
```

The migration adds nullable `ownerId` and `createdById` columns so existing data remains valid without backfilling.


## API Design

### Registration Endpoint (`app/api/auth/register/route.ts`)

```typescript
// POST /api/auth/register
// Body: { email: string, password: string, name: string }
// Response 201: { id, email, name, role, createdAt }
// Response 400: ValidationError (invalid email, short/long password, bad name)
// Response 409: ConflictError (email exists)
```

### Profile Endpoints (`app/api/users/me/route.ts`)

```typescript
// GET /api/users/me
// Requires: authenticated session
// Response 200: { id, email, name, role }

// PATCH /api/users/me
// Requires: authenticated session
// Body: { name: string }  (email and role fields are ignored)
// Response 200: { id, email, name, role }
// Response 400: ValidationError (name validation)
```

### Admin User Management (`app/api/admin/users/route.ts`)

```typescript
// GET /api/admin/users
// Requires: Admin role
// Response 200: [{ id, email, name, role, createdAt }]
// Response 403: ForbiddenError (non-Admin)

// PATCH /api/admin/users/[id]
// Requires: Admin role
// Body: { role: "Admin" | "Manager" | "Member" }
// Response 200: { id, email, name, role, createdAt }
// Response 403: ForbiddenError (non-Admin or self-role-change)
// Response 404: NotFoundError (user not found)
```

## Middleware Strategy

### Next.js Middleware (`middleware.ts`)

The Next.js middleware intercepts all requests and enforces authentication at the edge:

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicPaths = ["/login", "/register", "/api/auth", "/api/auth/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Allow public paths without auth
  if (isPublic) {
    // Redirect authenticated users away from login/register
    if (req.auth && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Require authentication for everything else
  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```


### API-Level Auth Helpers (`lib/auth-helpers.ts`)

Higher-order functions that compose with the existing `withErrorHandling`:

```typescript
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { RouteContext } from "@/lib/api-handler";

export interface AuthenticatedRequest extends NextRequest {
  user: { id: string; email: string; name: string; role: string };
}

/**
 * Wraps a route handler to require authentication.
 * Injects user context from the JWT session.
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, ctx: RouteContext) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: RouteContext): Promise<NextResponse> => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    (req as AuthenticatedRequest).user = session.user as AuthenticatedRequest["user"];
    return handler(req as AuthenticatedRequest, ctx);
  };
}

/**
 * Wraps a route handler to require a specific role (or set of roles).
 * Must be used after withAuth.
 */
export function withRole(...roles: string[]) {
  return (
    handler: (req: AuthenticatedRequest, ctx: RouteContext) => Promise<NextResponse>
  ) => {
    return async (req: AuthenticatedRequest, ctx: RouteContext): Promise<NextResponse> => {
      if (!roles.includes(req.user.role)) {
        return NextResponse.json(
          { error: "Forbidden", message: "Insufficient permissions" },
          { status: 403 }
        );
      }
      return handler(req, ctx);
    };
  };
}
```

### RBAC Permission Logic (`lib/permissions.ts`)

Centralized permission checking for resource-level access:

```typescript
import { Role } from "@prisma/client";

export type Action = "create" | "read" | "update" | "delete";
export type Resource = "project" | "task" | "user";

interface PermissionContext {
  userRole: Role;
  userId: string;
  resourceOwnerId?: string | null;
}

/**
 * Determines if a user can perform an action on a resource.
 * - Admin: all actions on all resources
 * - Manager: all actions on projects and tasks
 * - Member: read all; create/update/delete only owned resources
 */
export function canPerformAction(
  action: Action,
  resource: Resource,
  context: PermissionContext
): boolean {
  const { userRole, userId, resourceOwnerId } = context;

  if (userRole === "Admin") return true;

  if (resource === "user") return false; // Only Admin can manage users

  if (userRole === "Manager") return true; // Managers have full project/task access

  // Member role
  if (action === "read") return true;

  // For create, update, delete: must own the resource
  // Null ownerId means legacy data — accessible to all authenticated users
  if (resourceOwnerId === null || resourceOwnerId === undefined) return true;
  return resourceOwnerId === userId;
}
```


## Frontend Auth Flow

### SessionProvider Integration (`app/providers.tsx`)

The `SessionProvider` from NextAuth.js wraps the application to provide session context:

```typescript
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

### AuthGuard Component (`components/auth/AuthGuard.tsx`)

A client component that checks session status and shows loading or redirects:

```typescript
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CircularProgress, Box } from "@mui/material";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  return <>{children}</>;
}
```

### Layout Integration

The root layout conditionally renders `AppShell` for authenticated pages:

```typescript
// app/(protected)/layout.tsx — group layout for all authenticated pages
export default function ProtectedLayout({ children }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

// app/(auth)/layout.tsx — group layout for login/register (no AppShell)
export default function AuthLayout({ children }) {
  return <>{children}</>;
}
```


### Header with User Info (`components/layout/Header.tsx`)

The Header gains a user menu showing the current user's name and a logout button:

```typescript
"use client";
import { useSession, signOut } from "next-auth/react";
import { Avatar, Menu, MenuItem, IconButton, Typography } from "@mui/material";

// Adds to existing Header component:
// - Avatar/IconButton with user initial on the right side
// - Dropdown menu with user name, role, and "Sign Out" option
// - signOut() call redirects to /login
```

## Services Layer

### Auth Service (`services/auth.service.ts`)

```typescript
import { hash } from "bcryptjs";
import { userRepository } from "@/repositories/user.repository";
import { ConflictError, ValidationError } from "@/lib/errors";

export class AuthService {
  /**
   * Registers a new user with email/password.
   * - Validates input (email format, password length 8-128, name 1-100)
   * - Checks for duplicate email (throws ConflictError)
   * - Hashes password with bcrypt cost factor 10
   * - Creates user with Member role
   * - Returns user without password
   */
  async register(input: { email: string; password: string; name: string }) {
    // Validation via Zod schema (registerSchema)
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    const hashedPassword = await hash(input.password, 10);
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      hashedPassword,
      role: "Member",
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };
  }
}

export const authService = new AuthService();
```


### User Service (`services/user.service.ts`)

```typescript
import { userRepository } from "@/repositories/user.repository";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { ForbiddenError } from "@/lib/errors";

export class UserService {
  /** Returns profile for the given user ID (id, email, name, role). */
  async getProfile(userId: string) { /* ... */ }

  /** Updates only the name field. Ignores email/role in payload. */
  async updateProfile(userId: string, data: { name: string }) { /* ... */ }

  /** Admin: lists all users (id, email, name, role, createdAt). */
  async listUsers() { /* ... */ }

  /** Admin: changes a user's role. Rejects self-role-change. */
  async changeRole(adminId: string, targetUserId: string, newRole: string) {
    if (adminId === targetUserId) {
      throw new ForbiddenError("Cannot change your own role");
    }
    // ...
  }
}

export const userService = new UserService();
```

### New Error Class

```typescript
// Added to lib/errors.ts
export class ForbiddenError extends AppError {
  statusCode = 403;
  errorType = "ForbiddenError";

  constructor(message: string = "You do not have permission to perform this action") {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  statusCode = 401;
  errorType = "UnauthorizedError";

  constructor(message: string = "Authentication required") {
    super(message);
  }
}
```

## User Repository (`repositories/user.repository.ts`)

```typescript
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export interface UserCreateData {
  email: string;
  name: string;
  hashedPassword: string;
  role: Role;
}

export class UserRepository {
  async findByEmail(email: string) { /* ... */ }
  async findById(id: string) { /* ... */ }
  async create(data: UserCreateData) { /* ... */ }
  async updateName(id: string, name: string) { /* ... */ }
  async updateRole(id: string, role: Role) { /* ... */ }
  async findAll() { /* ... */ }
}

export const userRepository = new UserRepository();
```


## Validators

### Registration Validator (`validators/auth.validator.ts`)

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
}).strict();

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
}).strict();

export const changeRoleSchema = z.object({
  role: z.enum(["Admin", "Manager", "Member"]),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
```

## Component Changes

### Login Page (`app/(auth)/login/page.tsx`)

- Uses React Hook Form with Zod resolver for client-side validation
- Fields: email, password
- Submit calls NextAuth.js `signIn("credentials", { ... })`
- Displays generic error message on failure ("Invalid email or password")
- Link to /register
- Rendered without AppShell (uses (auth) route group layout)

### Register Page (`app/(auth)/register/page.tsx`)

- Uses React Hook Form with Zod resolver
- Fields: name, email, password, confirmPassword
- Client-side validation: confirmPassword must match password
- Submit calls `POST /api/auth/register` then auto-signs-in
- Shows specific errors (duplicate email → "Email already in use")
- Link to /login
- Rendered without AppShell

### Admin Users Page (`app/(protected)/admin/users/page.tsx`)

- Table/list of all users with id, email, name, role, createdAt
- Role dropdown for each user (disabled for current admin user)
- Calls `PATCH /api/admin/users/[id]` on role change
- Only accessible to Admin role (middleware + UI check)


## New File Structure

```
lib/
  auth.ts                          # NextAuth.js configuration
  auth-helpers.ts                  # withAuth, withRole HOFs
  permissions.ts                   # canPerformAction logic

types/
  next-auth.d.ts                   # Session/JWT type augmentation
  user.types.ts                    # User, UserProfile types

validators/
  auth.validator.ts                # register, login, profile, role schemas

repositories/
  user.repository.ts               # User data access

services/
  auth.service.ts                  # Registration logic
  user.service.ts                  # Profile + admin user management

app/
  (auth)/
    login/page.tsx                 # Login page
    register/page.tsx              # Registration page
    layout.tsx                     # Auth layout (no AppShell)
  (protected)/
    layout.tsx                     # Protected layout (AuthGuard + AppShell)
    admin/
      users/page.tsx               # Admin user management
    page.tsx                       # Dashboard (moved from app/page.tsx)
    projects/...                   # Existing project pages
    tasks/...                      # Existing task pages
  api/
    auth/
      [...nextauth]/route.ts       # NextAuth.js route handler
      register/route.ts            # Registration endpoint
    users/
      me/route.ts                  # Profile GET/PATCH
    admin/
      users/route.ts               # Admin list users
      users/[id]/route.ts          # Admin change role

components/
  auth/
    AuthGuard.tsx                   # Session check + redirect
    LoginForm.tsx                   # Login form component
    RegisterForm.tsx                # Registration form component

middleware.ts                       # Next.js edge middleware
```

## Data Flow Examples

### Registration Flow

1. User fills register form → client-side Zod validates (including confirmPassword match)
2. `POST /api/auth/register` with `{ email, password, name }`
3. Route handler validates via `registerSchema`
4. `authService.register()` checks duplicate email, hashes password, creates user
5. Returns `201 { id, email, name, role, createdAt }`
6. Frontend calls `signIn("credentials", { email, password })` to auto-login
7. NextAuth.js issues JWT cookie, redirects to dashboard

### Protected API Request Flow

1. Client makes request with session cookie
2. Next.js middleware calls `auth()` to validate JWT
3. If invalid/expired → 401 for API routes, redirect for pages
4. If valid → request passes to route handler
5. Route handler uses `withAuth` to extract user context
6. Service layer uses `canPerformAction` for resource-level checks
7. Returns data or 403 if forbidden

### Role Change Flow

1. Admin navigates to /admin/users → loads user list
2. Admin selects new role for a user
3. `PATCH /api/admin/users/[id]` with `{ role: "Manager" }`
4. `withRole("Admin")` checks admin permission
5. `userService.changeRole()` validates not self-change, updates role
6. Returns updated user record


## Error Handling

The auth system extends the existing error hierarchy:

| Error | Status | When |
|-------|--------|------|
| `ValidationError` | 400 | Invalid registration/profile input |
| `UnauthorizedError` | 401 | Missing or invalid session/JWT |
| `ForbiddenError` | 403 | Insufficient role or ownership |
| `NotFoundError` | 404 | User not found (admin operations) |
| `ConflictError` | 409 | Duplicate email registration |

All errors flow through `withErrorHandling` for consistent JSON responses. Auth errors from middleware return directly (not wrapped) since they operate at the edge.

## Security Considerations

- **Password hashing**: bcrypt with cost factor 10, max 128 chars to prevent DoS
- **JWT**: Signed by `AUTH_SECRET` env var, contains only non-sensitive user data
- **Cookies**: HttpOnly, Secure (production), SameSite=Lax — all handled by NextAuth.js defaults
- **CSRF**: Built-in NextAuth.js CSRF token protection
- **Error messages**: Login failures return generic "Invalid credentials" regardless of whether email or password was wrong
- **Password exclusion**: `hashedPassword` is never included in API responses or JWT; repository select clauses exclude it from read queries

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration assigns Member role

*For any* valid registration input (valid email, password 8-128 chars, name 1-100 chars), the created User record SHALL have the role set to "Member".

**Validates: Requirements 1.1**

### Property 2: Password hashing integrity

*For any* password submitted during registration, the stored value SHALL be a valid bcrypt hash with cost factor >= 10, and comparing the original password against the hash SHALL return true.

**Validates: Requirements 1.2, 10.1**


### Property 3: Duplicate email rejection

*For any* email string, if a User with that email already exists in the database, a subsequent registration attempt with the same email SHALL return a 409 Conflict error.

**Validates: Requirements 1.3**

### Property 4: Registration input validation

*For any* registration input where the email format is invalid, OR the password is shorter than 8 characters, OR the password exceeds 128 characters, OR the name is empty, OR the name exceeds 100 characters, the Registration_Handler SHALL return a 400 Validation error and NOT create a User record.

**Validates: Requirements 1.4, 1.5, 1.6, 10.6**

### Property 5: Authentication failure indistinguishability

*For any* login attempt that fails (whether due to non-existent email or incorrect password), the error response SHALL be identical in structure and message content, revealing neither which field was incorrect.

**Validates: Requirements 2.2, 2.3**

### Property 6: JWT payload completeness

*For any* successfully authenticated User, the issued JWT token SHALL contain the User's id, email, name, and role fields with values matching the database record.

**Validates: Requirements 2.4, 3.4**

### Property 7: Unauthenticated API rejection

*For any* request to a protected API route (/api/projects/*, /api/tasks/*, /api/dashboard/*) that does not include a valid session token, the system SHALL return a 401 Unauthorized response.

**Validates: Requirements 4.1**


### Property 8: Invalid JWT rejection

*For any* JWT token that has been tampered with or has an invalid signature, the system SHALL reject the request and return a 401 Unauthorized response.

**Validates: Requirements 10.5**

### Property 9: Role-based access control consistency

*For any* User and any resource (project or task), the `canPerformAction` function SHALL return:
- `true` for all actions when the User's role is Admin
- `true` for all CRUD actions on projects/tasks when the User's role is Manager
- `true` for read actions when the User's role is Member
- `true` for create/update/delete actions when the User's role is Member AND the resource is owned by that User (or has null owner)
- `false` for create/update/delete actions when the User's role is Member AND the resource is owned by a different User

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 10: Password exclusion from responses

*For any* API response from any endpoint (registration, profile, user list, session), the response body and JWT token SHALL never contain a `password` or `hashedPassword` field.

**Validates: Requirements 10.4**

### Property 11: Profile update immutability of protected fields

*For any* profile update request, regardless of what fields are included in the request body, the User's email and role SHALL remain unchanged after the operation.

**Validates: Requirements 7.4**

### Property 12: Admin self-role-change prevention

*For any* Admin User attempting to change their own role via the admin endpoint, the system SHALL reject the request and leave the Admin's role unchanged.

**Validates: Requirements 11.3**


### Property 13: Non-Admin user management denial

*For any* User whose role is Manager or Member, any attempt to access the user list endpoint or change another User's role SHALL return a 403 Forbidden response.

**Validates: Requirements 11.4, 6.6**

### Property 14: Registration confirmation password mismatch

*For any* two distinct strings used as password and confirmPassword on the registration form, client-side validation SHALL produce an error and prevent the API request from being submitted.

**Validates: Requirements 9.3**

### Property 15: Frontend unauthenticated redirect

*For any* page path that is not /login or /register, an unauthenticated user navigating to that path SHALL be redirected to /login.

**Validates: Requirements 5.1**
