import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the Prisma client to prevent real DB connections
vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

// Mock the auth function to return a valid session by default
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-123",
      email: "member@example.com",
      name: "Member User",
      role: "Member",
    },
  }),
}));

// Mock the project repository
vi.mock("@/repositories/project.repository", () => {
  const mockRepo = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByStatus: vi.fn(),
    countAll: vi.fn(),
    getAverageProgress: vi.fn(),
  };
  return {
    projectRepository: mockRepo,
    ProjectRepository: vi.fn(() => mockRepo),
  };
});

// Mock the task repository
vi.mock("@/repositories/task.repository", () => {
  const mockRepo = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByProject: vi.fn(),
    countByProjectAndStatus: vi.fn(),
    findOverdue: vi.fn(),
    findUpcomingDeadlines: vi.fn(),
  };
  return {
    taskRepository: mockRepo,
    TaskRepository: vi.fn(() => mockRepo),
  };
});

import { auth } from "@/lib/auth";
import { projectRepository } from "@/repositories/project.repository";
import { taskRepository } from "@/repositories/task.repository";

// Import route handlers
import { GET as getProjects, POST as createProject } from "@/app/api/projects/route";
import {
  PUT as updateProject,
  DELETE as deleteProject,
} from "@/app/api/projects/[id]/route";
import { POST as createTask } from "@/app/api/tasks/route";
import {
  PUT as updateTask,
  DELETE as deleteTask,
} from "@/app/api/tasks/[id]/route";

const mockAuth = vi.mocked(auth);

const mockProjectRepo = projectRepository as unknown as {
  findAll: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  countByStatus: ReturnType<typeof vi.fn>;
  countAll: ReturnType<typeof vi.fn>;
  getAverageProgress: ReturnType<typeof vi.fn>;
};

const mockTaskRepo = taskRepository as unknown as {
  findAll: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  countByProject: ReturnType<typeof vi.fn>;
  countByProjectAndStatus: ReturnType<typeof vi.fn>;
  findOverdue: ReturnType<typeof vi.fn>;
  findUpcomingDeadlines: ReturnType<typeof vi.fn>;
};

// Helper: create a NextRequest for a given URL
function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options as any);
}

// Helper: create a NextRequest with JSON body
function createJsonRequest(url: string, body: unknown, method = "POST"): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } as any);
}

// Helper: create route context with params (projects [id] route uses sync params)
function createProjectContext(id: string) {
  return { params: { id } };
}

// Helper: create route context with async params (tasks [id] route uses async params)
function createTaskContext(id: string): any {
  return { params: Promise.resolve({ id }) };
}

// Helper: mock auth session with a specific role
function mockSession(role: string, userId = "user-123") {
  mockAuth.mockResolvedValue({
    user: {
      id: userId,
      email: `${role.toLowerCase()}@example.com`,
      name: `${role} User`,
      role,
    },
    expires: "2099-01-01T00:00:00.000Z",
  } as any);
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "550e8400-e29b-41d4-a716-446655440001";
const VALID_PROJECT_ID = "550e8400-e29b-41d4-a716-446655440002";

const sampleProject = {
  id: VALID_UUID,
  name: "Test Project",
  description: "A test project",
  status: "Planned",
  priority: "Medium",
  startDate: null,
  dueDate: null,
  progress: 0,
  ownerId: "user-123",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  tasks: [],
};

const sampleTask = {
  id: VALID_UUID_2,
  title: "Test Task",
  description: "A test task",
  status: "Todo",
  priority: "Medium",
  dueDate: null,
  assignedTo: null,
  projectId: VALID_PROJECT_ID,
  createdById: "user-123",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default to Member role
  mockSession("Member");
});

describe("RBAC Integration Tests", () => {
  describe("Member role - Read access", () => {
    it("Member can read all projects (GET /api/projects returns 200)", async () => {
      mockProjectRepo.findAll.mockResolvedValue([sampleProject]);

      const req = createRequest("/api/projects");
      const res = await getProjects(req, createProjectContext(""));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe("Test Project");
    });
  });

  describe("Member role - Ownership on create", () => {
    it("Member can create a project and ownerId is set to session user id", async () => {
      const createdProject = {
        ...sampleProject,
        name: "New Project",
        ownerId: "user-123",
      };
      mockProjectRepo.create.mockResolvedValue(createdProject);

      const input = {
        name: "New Project",
        priority: "High",
      };

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createProjectContext(""));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(mockProjectRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: "user-123",
        })
      );
    });
  });

  describe("Member role - Cannot modify others' resources", () => {
    it("Member CANNOT update a project owned by another user (returns 403)", async () => {
      // Project owned by another user
      const otherUserProject = {
        ...sampleProject,
        ownerId: "other-user-456",
      };
      mockProjectRepo.findById.mockResolvedValue(otherUserProject);

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { name: "Updated" },
        "PUT"
      );
      const res = await updateProject(req, createProjectContext(VALID_UUID));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe("ForbiddenError");
    });

    it("Member CANNOT delete a project owned by another user (returns 403)", async () => {
      // Project owned by another user
      const otherUserProject = {
        ...sampleProject,
        ownerId: "other-user-456",
      };
      mockProjectRepo.findById.mockResolvedValue(otherUserProject);

      const req = createRequest(`/api/projects/${VALID_UUID}`);
      const res = await deleteProject(req, createProjectContext(VALID_UUID));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe("ForbiddenError");
    });
  });

  describe("Member role - Can modify own resources", () => {
    it("Member CAN update their own project (returns 200)", async () => {
      // Project owned by the current user
      const ownProject = {
        ...sampleProject,
        ownerId: "user-123",
      };
      mockProjectRepo.findById.mockResolvedValue(ownProject);
      mockProjectRepo.update.mockResolvedValue({ ...ownProject, name: "Updated Name" });

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { name: "Updated Name" },
        "PUT"
      );
      const res = await updateProject(req, createProjectContext(VALID_UUID));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.name).toBe("Updated Name");
    });
  });

  describe("Manager role - Full project/task access", () => {
    it("Manager can update any project regardless of ownership (returns 200)", async () => {
      mockSession("Manager", "manager-user-789");

      // Project owned by someone else
      const otherUserProject = {
        ...sampleProject,
        ownerId: "user-123",
      };
      mockProjectRepo.findById.mockResolvedValue(otherUserProject);
      mockProjectRepo.update.mockResolvedValue({ ...otherUserProject, name: "Manager Updated" });

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { name: "Manager Updated" },
        "PUT"
      );
      const res = await updateProject(req, createProjectContext(VALID_UUID));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.name).toBe("Manager Updated");
    });

    it("Manager can delete any task regardless of ownership (returns 200)", async () => {
      mockSession("Manager", "manager-user-789");

      // Task created by someone else
      const otherUserTask = {
        ...sampleTask,
        createdById: "user-123",
      };
      mockTaskRepo.findById.mockResolvedValue(otherUserTask);
      mockTaskRepo.delete.mockResolvedValue(otherUserTask);
      mockTaskRepo.countByProject.mockResolvedValue(0);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(0);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const req = createRequest(`/api/tasks/${VALID_UUID_2}`);
      const res = await deleteTask(req, createTaskContext(VALID_UUID_2));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.id).toBe(VALID_UUID_2);
    });
  });

  describe("Ownership assignment on task create", () => {
    it("POST /api/tasks sets createdById to session user id", async () => {
      mockSession("Member");

      const projectForTask = {
        id: VALID_PROJECT_ID,
        name: "Project",
        description: null,
        status: "In Progress",
        priority: "High",
        startDate: null,
        dueDate: null,
        progress: 50,
        ownerId: "user-123",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        tasks: [],
      };
      mockProjectRepo.findById.mockResolvedValue(projectForTask);

      const createdTask = {
        ...sampleTask,
        projectId: VALID_PROJECT_ID,
        createdById: "user-123",
      };
      mockTaskRepo.create.mockResolvedValue(createdTask);
      mockTaskRepo.countByProject.mockResolvedValue(1);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(0);
      mockProjectRepo.update.mockResolvedValue(projectForTask);

      const input = {
        title: "New Task",
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
      };

      const req = createJsonRequest("/api/tasks", input);
      const res = await createTask(req, createTaskContext(""));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(mockTaskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdById: "user-123",
        })
      );
    });
  });
});
