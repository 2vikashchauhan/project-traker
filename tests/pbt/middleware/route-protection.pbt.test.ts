import fc from "fast-check";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the auth function from lib/auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-helpers";
import { RouteContext } from "@/lib/api-handler";

const mockedAuth = vi.mocked(auth);

// --- Arbitraries ---

/** Generates a random path segment (alphanumeric + hyphens, like real URL slugs) */
const pathSegmentArb = fc.stringOf(
  fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-_".split("")),
  { minLength: 1, maxLength: 30 }
);

/** Generates a UUID-like ID for path segments */
const uuidSegmentArb = fc.uuid();

/** Generates a random suffix for protected API routes (e.g., /api/projects/abc123) */
const protectedProjectPathArb = fc
  .tuple(
    fc.constantFrom("", "/"),
    fc.oneof(uuidSegmentArb, pathSegmentArb)
  )
  .map(([slash, segment]) => `/api/projects${slash}${segment}`);

const protectedTaskPathArb = fc
  .tuple(
    fc.constantFrom("", "/"),
    fc.oneof(uuidSegmentArb, pathSegmentArb)
  )
  .map(([slash, segment]) => `/api/tasks${slash}${segment}`);

const protectedDashboardPathArb = fc.constant("/api/dashboard");

/** Generates any protected API path */
const protectedApiPathArb = fc.oneof(
  protectedProjectPathArb,
  protectedTaskPathArb,
  protectedDashboardPathArb
);

/** Generates an HTTP method */
const httpMethodArb = fc.constantFrom("GET", "POST", "PUT", "PATCH", "DELETE");

/** Generates a random tampered JWT-like string (simulates invalid tokens) */
const tamperedJwtArb = fc
  .tuple(
    fc.base64String({ minLength: 10, maxLength: 50 }),
    fc.base64String({ minLength: 10, maxLength: 50 }),
    fc.base64String({ minLength: 10, maxLength: 50 })
  )
  .map(([header, payload, signature]) => `${header}.${payload}.${signature}`);

// --- Helpers ---

function createMockRequest(path: string, method: string = "GET"): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), { method });
}

function createMockContext(): RouteContext {
  return { params: {} };
}

/** A dummy handler that should never be called when auth fails */
function successHandler(req: AuthenticatedRequest, _ctx: RouteContext): Promise<NextResponse> {
  return Promise.resolve(
    NextResponse.json({ success: true, user: req.user }, { status: 200 })
  );
}

// --- Tests ---

/**
 * Property 7: Unauthenticated API rejection
 *
 * **Validates: Requirements 4.1**
 *
 * For any request to a protected API route (/api/projects/*, /api/tasks/*, /api/dashboard/*)
 * that does not include a valid session token, the system SHALL return a 401 Unauthorized response.
 */
describe("Property 7: Unauthenticated API rejection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("withAuth SHALL return 401 for any protected API route when session is null (unauthenticated)", () => {
    fc.assert(
      fc.asyncProperty(protectedApiPathArb, httpMethodArb, async (path, method) => {
        // auth() returns null when there is no valid session
        mockedAuth.mockResolvedValue(null as any);

        const protectedHandler = withAuth(successHandler);
        const req = createMockRequest(path, method);
        const ctx = createMockContext();

        const response = await protectedHandler(req, ctx);

        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toBe("Unauthorized");
        expect(body.message).toBe("Authentication required");
      }),
      { numRuns: 100 }
    );
  });

  it("withAuth SHALL return 401 when session exists but user is undefined", () => {
    fc.assert(
      fc.asyncProperty(protectedApiPathArb, httpMethodArb, async (path, method) => {
        // session exists but has no user property
        mockedAuth.mockResolvedValue({ user: undefined } as any);

        const protectedHandler = withAuth(successHandler);
        const req = createMockRequest(path, method);
        const ctx = createMockContext();

        const response = await protectedHandler(req, ctx);

        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toBe("Unauthorized");
      }),
      { numRuns: 100 }
    );
  });

  it("withAuth SHALL return 401 when session exists but user is null", () => {
    fc.assert(
      fc.asyncProperty(protectedApiPathArb, httpMethodArb, async (path, method) => {
        // session exists but user is null
        mockedAuth.mockResolvedValue({ user: null } as any);

        const protectedHandler = withAuth(successHandler);
        const req = createMockRequest(path, method);
        const ctx = createMockContext();

        const response = await protectedHandler(req, ctx);

        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body.error).toBe("Unauthorized");
      }),
      { numRuns: 100 }
    );
  });

  it("withAuth SHALL NOT call the inner handler when unauthenticated", () => {
    fc.assert(
      fc.asyncProperty(protectedApiPathArb, async (path) => {
        mockedAuth.mockResolvedValue(null as any);

        const innerHandler = vi.fn().mockResolvedValue(
          NextResponse.json({ success: true }, { status: 200 })
        );
        const protectedHandler = withAuth(innerHandler);
        const req = createMockRequest(path);
        const ctx = createMockContext();

        await protectedHandler(req, ctx);

        expect(innerHandler).not.toHaveBeenCalled();
      }),
      { numRuns: 50 }
    );
  });
});

/**
 * Property 8: Invalid JWT rejection
 *
 * **Validates: Requirements 10.5**
 *
 * For any JWT token that has been tampered with or has an invalid signature,
 * the system SHALL reject the request and return a 401 Unauthorized response.
 *
 * Note: When a JWT is tampered with or has an invalid signature, NextAuth's auth()
 * function returns null (no valid session). The withAuth helper then rejects with 401.
 * This test verifies that regardless of what tampered token content might look like,
 * if auth() cannot validate it (returns null), the system correctly rejects.
 */
describe("Property 8: Invalid JWT rejection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("withAuth SHALL return 401 for any request with a tampered/invalid JWT (auth returns null)", () => {
    fc.assert(
      fc.asyncProperty(
        protectedApiPathArb,
        httpMethodArb,
        tamperedJwtArb,
        async (path, method, _tamperedToken) => {
          // A tampered JWT results in auth() returning null
          // (NextAuth fails signature verification and returns no session)
          mockedAuth.mockResolvedValue(null as any);

          const protectedHandler = withAuth(successHandler);
          const req = createMockRequest(path, method);
          const ctx = createMockContext();

          const response = await protectedHandler(req, ctx);

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body.error).toBe("Unauthorized");
          expect(body.message).toBe("Authentication required");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("withAuth SHALL return 401 when auth() returns session with empty user (corrupted token)", () => {
    fc.assert(
      fc.asyncProperty(
        protectedApiPathArb,
        tamperedJwtArb,
        async (path, _tamperedToken) => {
          // A corrupted token might result in a partial session object
          mockedAuth.mockResolvedValue({ expires: "2024-01-01", user: null } as any);

          const protectedHandler = withAuth(successHandler);
          const req = createMockRequest(path);
          const ctx = createMockContext();

          const response = await protectedHandler(req, ctx);

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body.error).toBe("Unauthorized");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("withAuth SHALL NOT leak any user data in 401 response regardless of token content", () => {
    fc.assert(
      fc.asyncProperty(
        protectedApiPathArb,
        tamperedJwtArb,
        async (path, _tamperedToken) => {
          mockedAuth.mockResolvedValue(null as any);

          const protectedHandler = withAuth(successHandler);
          const req = createMockRequest(path);
          const ctx = createMockContext();

          const response = await protectedHandler(req, ctx);
          const body = await response.json();

          // Ensure no user data is exposed in error response
          expect(body).not.toHaveProperty("user");
          expect(body).not.toHaveProperty("id");
          expect(body).not.toHaveProperty("email");
          expect(body).not.toHaveProperty("role");
          expect(body).not.toHaveProperty("token");
        }
      ),
      { numRuns: 100 }
    );
  });
});
