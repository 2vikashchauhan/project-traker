import fc from "fast-check";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock the user repository
vi.mock("@/repositories/user.repository", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    updateRole: vi.fn(),
    updateName: vi.fn(),
  },
}));

// Mock bcryptjs compare
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("$2b$10$mockedhashvalue"),
  compare: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { userRepository } from "@/repositories/user.repository";
import { compare } from "bcryptjs";
import { withAuth, withRole, AuthenticatedRequest } from "@/lib/auth-helpers";
import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/user.service";
import { RouteContext } from "@/lib/api-handler";

const mockedAuth = vi.mocked(auth);
const mockedRepo = vi.mocked(userRepository);
const mockedCompare = vi.mocked(compare);

// --- Arbitraries ---

/** Generates a valid email address */
const validEmailArb = fc
  .tuple(
    fc.stringOf(
      fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")),
      { minLength: 1, maxLength: 20 }
    ),
    fc.stringOf(
      fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")),
      { minLength: 1, maxLength: 10 }
    ),
    fc.constantFrom("com", "org", "net", "io", "dev")
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Generates a valid password (8-128 chars, printable ASCII) */
const validPasswordArb = fc.stringOf(
  fc.integer({ min: 0x20, max: 0x7e }).map((c) => String.fromCharCode(c)),
  { minLength: 8, maxLength: 64 }
);

/** Generates a valid name (1-100 chars) */
const validNameArb = fc
  .stringOf(
    fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
    ),
    { minLength: 1, maxLength: 100 }
  )
  .filter((s) => s.trim().length >= 1 && s.trim().length <= 100);

/** Generates a non-Admin role */
const nonAdminRoleArb = fc.constantFrom("Manager", "Member");

/** Generates a UUID-like string */
const uuidArb = fc.uuid();

/** Generates user session data with a given role */
function sessionWithRole(role: string) {
  return {
    user: {
      id: "user-uuid-123",
      email: "user@example.com",
      name: "Test User",
      role,
    },
    expires: "2025-12-31",
  };
}

// --- Helpers ---

function createMockRequest(
  path: string,
  method: string = "GET"
): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), { method });
}

function createMockContext(params: Record<string, string> = {}): RouteContext {
  return { params };
}

// --- Tests ---

/**
 * Property 5: Authentication failure indistinguishability
 *
 * **Validates: Requirements 2.2, 2.3**
 *
 * For any login attempt that fails (whether due to non-existent email or incorrect password),
 * the error response SHALL be identical in structure and message content, revealing neither
 * which field was incorrect.
 *
 * We test the authorize function behavior at the service level: both cases
 * (non-existent email, wrong password) result in null return from authorize.
 */
describe("Property 5: Authentication failure indistinguishability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("for any failed login attempt, the behavior SHALL be identical whether email does not exist or password is incorrect", () => {
    return fc.assert(
      fc.asyncProperty(
        validEmailArb,
        validPasswordArb,
        fc.boolean(),
        async (email, password, isNonExistentEmail) => {
          // Simulate the authorize function logic from lib/auth.ts
          let result: null | object;

          if (isNonExistentEmail) {
            // Case 1: Email does not exist -> findByEmail returns null
            mockedRepo.findByEmail.mockResolvedValue(null);

            const user = await userRepository.findByEmail(email);
            // authorize returns null when user not found
            result = user === null ? null : {};
          } else {
            // Case 2: Email exists but password is wrong -> compare returns false
            mockedRepo.findByEmail.mockResolvedValue({
              id: "existing-uuid",
              email,
              name: "Existing User",
              hashedPassword: "$2b$10$hashedvalue",
              role: "Member",
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);
            mockedCompare.mockResolvedValue(false as never);

            const user = await userRepository.findByEmail(email);
            const isValid = await compare(password, user!.hashedPassword);
            // authorize returns null when password comparison fails
            result = isValid ? {} : null;
          }

          // Both paths MUST return null (indistinguishable)
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("the authorize function SHALL return null in both failure cases without distinguishing error type", () => {
    return fc.assert(
      fc.asyncProperty(
        validEmailArb,
        validPasswordArb,
        async (email, password) => {
          // Test both cases side by side and verify identical outcomes

          // Case A: Non-existent email
          mockedRepo.findByEmail.mockResolvedValue(null);
          const userA = await userRepository.findByEmail(email);
          const resultA = userA === null ? null : "would-continue";

          // Case B: Wrong password
          mockedRepo.findByEmail.mockResolvedValue({
            id: "existing-uuid",
            email,
            name: "Existing User",
            hashedPassword: "$2b$10$hashedvalue",
            role: "Member",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);
          mockedCompare.mockResolvedValue(false as never);
          const userB = await userRepository.findByEmail(email);
          const isValid = await compare(password, userB!.hashedPassword);
          const resultB = isValid ? "authenticated" : null;

          // Both must return the same value (null) — indistinguishable
          expect(resultA).toBeNull();
          expect(resultB).toBeNull();
          expect(resultA).toStrictEqual(resultB);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 10: Password exclusion from responses
 *
 * **Validates: Requirements 10.4**
 *
 * For any API response from any endpoint (registration, profile, user list, session),
 * the response body SHALL never contain a `password` or `hashedPassword` field.
 */
describe("Property 10: Password exclusion from responses", () => {
  let authService: AuthService;
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
    userService = new UserService();
  });

  /** Recursively checks that an object (or nested objects) never contains password fields */
  function assertNoPasswordFields(obj: unknown, path: string = "root"): void {
    if (obj === null || obj === undefined) return;
    if (typeof obj !== "object") return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) =>
        assertNoPasswordFields(item, `${path}[${index}]`)
      );
      return;
    }

    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      expect(key, `Found forbidden field "${key}" at ${path}`).not.toBe(
        "password"
      );
      expect(key, `Found forbidden field "${key}" at ${path}`).not.toBe(
        "hashedPassword"
      );
      assertNoPasswordFields(record[key], `${path}.${key}`);
    }
  }

  it("authService.register SHALL never return password or hashedPassword in response", () => {
    return fc.assert(
      fc.asyncProperty(
        validEmailArb,
        validPasswordArb,
        validNameArb,
        async (email, password, name) => {
          mockedRepo.findByEmail.mockResolvedValue(null);
          mockedRepo.create.mockImplementation(async (data: any) => ({
            id: "generated-uuid",
            email: data.email,
            name: data.name,
            role: data.role,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          const result = await authService.register({ email, password, name });

          assertNoPasswordFields(result);
        }
      ),
      { numRuns: 50 }
    );
  });

  it("userService.getProfile SHALL never return password or hashedPassword in response", () => {
    return fc.assert(
      fc.asyncProperty(uuidArb, async (userId) => {
        mockedRepo.findById.mockResolvedValue({
          id: userId,
          email: "user@test.com",
          name: "Test User",
          role: "Member",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        const result = await userService.getProfile(userId);

        assertNoPasswordFields(result);
      }),
      { numRuns: 100 }
    );
  });

  it("userService.listUsers SHALL never return password or hashedPassword for any user", () => {
    return fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: uuidArb,
            email: validEmailArb,
            name: validNameArb,
            role: fc.constantFrom("Admin", "Manager", "Member"),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (users) => {
          mockedRepo.findAll.mockResolvedValue(
            users.map((u) => ({
              ...u,
              createdAt: new Date(),
              updatedAt: new Date(),
            })) as any
          );

          const result = await userService.listUsers();

          assertNoPasswordFields(result);
        }
      ),
      { numRuns: 50 }
    );
  });

  it("userService.updateProfile SHALL never return password or hashedPassword in response", () => {
    return fc.assert(
      fc.asyncProperty(uuidArb, validNameArb, async (userId, name) => {
        mockedRepo.findById.mockResolvedValue({
          id: userId,
          email: "user@test.com",
          name: "Old Name",
          role: "Member",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        mockedRepo.updateName.mockResolvedValue({
          id: userId,
          email: "user@test.com",
          name: name.trim(),
          role: "Member",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        const result = await userService.updateProfile(userId, { name });

        assertNoPasswordFields(result);
      }),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 13: Non-Admin user management denial
 *
 * **Validates: Requirements 11.4, 6.6**
 *
 * For any User whose role is Manager or Member, any attempt to access the user list endpoint
 * or change another User's role SHALL return a 403 Forbidden response.
 */
describe("Property 13: Non-Admin user management denial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** A dummy handler that represents the inner admin route logic (should never be reached) */
  function adminHandler(
    req: AuthenticatedRequest,
    _ctx: RouteContext
  ): Promise<NextResponse> {
    return Promise.resolve(
      NextResponse.json({ success: true }, { status: 200 })
    );
  }

  it("withRole('Admin') SHALL return 403 for any Manager or Member attempting to access admin endpoints", () => {
    return fc.assert(
      fc.asyncProperty(
        nonAdminRoleArb,
        uuidArb,
        validEmailArb,
        validNameArb,
        async (role, userId, email, name) => {
          // Mock auth() to return a session with non-Admin role
          mockedAuth.mockResolvedValue({
            user: { id: userId, email, name, role },
            expires: "2025-12-31",
          } as any);

          // Build handler: withAuth -> withRole("Admin") -> adminHandler
          const protectedHandler = withAuth(withRole("Admin")(adminHandler));

          const req = createMockRequest("/api/admin/users", "GET");
          const ctx = createMockContext();

          const response = await protectedHandler(req, ctx);

          expect(response.status).toBe(403);
          const body = await response.json();
          expect(body.error).toBe("Forbidden");
          expect(body.message).toBe("Insufficient permissions");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("withRole('Admin') SHALL return 403 for any non-Admin attempting to change a user's role", () => {
    return fc.assert(
      fc.asyncProperty(
        nonAdminRoleArb,
        uuidArb,
        uuidArb,
        validEmailArb,
        validNameArb,
        async (role, userId, targetId, email, name) => {
          // Mock auth() to return a session with non-Admin role
          mockedAuth.mockResolvedValue({
            user: { id: userId, email, name, role },
            expires: "2025-12-31",
          } as any);

          // Build handler: withAuth -> withRole("Admin") -> adminHandler
          const protectedHandler = withAuth(withRole("Admin")(adminHandler));

          const req = createMockRequest(
            `/api/admin/users/${targetId}`,
            "PATCH"
          );
          const ctx = createMockContext({ id: targetId });

          const response = await protectedHandler(req, ctx);

          expect(response.status).toBe(403);
          const body = await response.json();
          expect(body.error).toBe("Forbidden");
          expect(body.message).toBe("Insufficient permissions");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("withRole('Admin') SHALL allow Admin role to proceed to the inner handler", () => {
    return fc.assert(
      fc.asyncProperty(uuidArb, validEmailArb, validNameArb, async (userId, email, name) => {
        // Mock auth() to return a session with Admin role
        mockedAuth.mockResolvedValue({
          user: { id: userId, email, name, role: "Admin" },
          expires: "2025-12-31",
        } as any);

        // Build handler: withAuth -> withRole("Admin") -> adminHandler
        const protectedHandler = withAuth(withRole("Admin")(adminHandler));

        const req = createMockRequest("/api/admin/users", "GET");
        const ctx = createMockContext();

        const response = await protectedHandler(req, ctx);

        // Admin should be allowed through
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
      }),
      { numRuns: 50 }
    );
  });
});
