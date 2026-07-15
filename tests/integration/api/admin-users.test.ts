import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the Prisma client to prevent real DB connections
vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

// Mock the auth function - default to Admin user
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "admin-123",
      email: "admin@example.com",
      name: "Admin User",
      role: "Admin",
    },
  }),
}));

// Mock the user repository
vi.mock("@/repositories/user.repository", () => {
  const mockRepo = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    updateName: vi.fn(),
    updateRole: vi.fn(),
  };
  return {
    userRepository: mockRepo,
    UserRepository: vi.fn(() => mockRepo),
  };
});

import { auth } from "@/lib/auth";
import { userRepository } from "@/repositories/user.repository";

// Import route handlers after mocks
import { GET } from "@/app/api/admin/users/route";
import { PATCH } from "@/app/api/admin/users/[id]/route";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockRepo = userRepository as unknown as {
  findAll: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findByEmail: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  updateName: ReturnType<typeof vi.fn>;
  updateRole: ReturnType<typeof vi.fn>;
};

// Helper: create a NextRequest for a given URL
function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options as any);
}

// Helper: create a NextRequest with JSON body
function createJsonRequest(url: string, body: unknown, method = "PATCH"): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper: create route context with params (Next.js 15 async params pattern)
function createContext(params: Record<string, string>): any {
  return { params: Promise.resolve(params) };
}

const ADMIN_ID = "admin-123";
const TARGET_USER_ID = "user-456";

const sampleUsers = [
  {
    id: ADMIN_ID,
    email: "admin@example.com",
    name: "Admin User",
    role: "Admin",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: TARGET_USER_ID,
    email: "member@example.com",
    name: "Member User",
    role: "Member",
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "user-789",
    email: "manager@example.com",
    name: "Manager User",
    role: "Manager",
    createdAt: "2024-02-01T00:00:00.000Z",
    updatedAt: "2024-02-01T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  // Reset to Admin session by default
  mockAuth.mockResolvedValue({
    user: {
      id: ADMIN_ID,
      email: "admin@example.com",
      name: "Admin User",
      role: "Admin",
    },
  });
});

describe("Admin Users API Integration Tests", () => {
  describe("GET /api/admin/users", () => {
    it("should return 200 with array of users when admin requests user list", async () => {
      mockRepo.findAll.mockResolvedValue(sampleUsers);

      const req = createRequest("/api/admin/users");
      const res = await GET(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(3);
      expect(body[0]).toHaveProperty("id");
      expect(body[0]).toHaveProperty("email");
      expect(body[0]).toHaveProperty("name");
      expect(body[0]).toHaveProperty("role");
      expect(body[0]).toHaveProperty("createdAt");
    });

    it("should return 403 when Member role requests user list", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "member-user-id",
          email: "member@example.com",
          name: "Member User",
          role: "Member",
        },
      });

      const req = createRequest("/api/admin/users");
      const res = await GET(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });

    it("should return 403 when Manager role requests user list", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "manager-user-id",
          email: "manager@example.com",
          name: "Manager User",
          role: "Manager",
        },
      });

      const req = createRequest("/api/admin/users");
      const res = await GET(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });

    it("should return 401 when unauthenticated user requests user list", async () => {
      mockAuth.mockResolvedValue(null);

      const req = createRequest("/api/admin/users");
      const res = await GET(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("PATCH /api/admin/users/[id]", () => {
    it("should return 200 with updated user when admin changes role", async () => {
      const updatedUser = {
        ...sampleUsers[1],
        role: "Manager",
      };
      mockRepo.findById.mockResolvedValue(sampleUsers[1]);
      mockRepo.updateRole.mockResolvedValue(updatedUser);

      const req = createJsonRequest(`/api/admin/users/${TARGET_USER_ID}`, {
        role: "Manager",
      });
      const res = await PATCH(req, createContext({ id: TARGET_USER_ID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.role).toBe("Manager");
      expect(body.id).toBe(TARGET_USER_ID);
    });

    it("should return 403 when admin tries to change own role", async () => {
      mockRepo.findById.mockResolvedValue(sampleUsers[0]);

      const req = createJsonRequest(`/api/admin/users/${ADMIN_ID}`, {
        role: "Member",
      });
      const res = await PATCH(req, createContext({ id: ADMIN_ID }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe("ForbiddenError");
      expect(body.message).toContain("Cannot change your own role");
    });

    it("should return 403 when Member role tries to change a role", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "member-user-id",
          email: "member@example.com",
          name: "Member User",
          role: "Member",
        },
      });

      const req = createJsonRequest(`/api/admin/users/${TARGET_USER_ID}`, {
        role: "Manager",
      });
      const res = await PATCH(req, createContext({ id: TARGET_USER_ID }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });

    it("should return 403 when Manager role tries to change a role", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "manager-user-id",
          email: "manager@example.com",
          name: "Manager User",
          role: "Manager",
        },
      });

      const req = createJsonRequest(`/api/admin/users/${TARGET_USER_ID}`, {
        role: "Admin",
      });
      const res = await PATCH(req, createContext({ id: TARGET_USER_ID }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe("Forbidden");
    });

    it("should return 401 when unauthenticated user tries to change a role", async () => {
      mockAuth.mockResolvedValue(null);

      const req = createJsonRequest(`/api/admin/users/${TARGET_USER_ID}`, {
        role: "Manager",
      });
      const res = await PATCH(req, createContext({ id: TARGET_USER_ID }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });
  });
});
