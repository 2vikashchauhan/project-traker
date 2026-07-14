import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the Prisma client to prevent real DB connections
vi.mock("@/lib/prisma", () => ({
  prisma: {},
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

import { projectRepository } from "@/repositories/project.repository";
import { Project, ProjectWithTasks } from "@/types/project.types";

// Import route handlers
import { GET as getProjects, POST as createProject } from "@/app/api/projects/route";
import {
  GET as getProject,
  PUT as updateProject,
  DELETE as deleteProject,
} from "@/app/api/projects/[id]/route";

const mockRepo = projectRepository as unknown as {
  findAll: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  countByStatus: ReturnType<typeof vi.fn>;
  countAll: ReturnType<typeof vi.fn>;
  getAverageProgress: ReturnType<typeof vi.fn>;
};

// Helper: create a NextRequest for a given URL
function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), options);
}

// Helper: create a NextRequest with JSON body
function createJsonRequest(url: string, body: unknown, method = "POST"): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Helper: create route context with params
function createContext(params: Record<string, string>) {
  return { params };
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "550e8400-e29b-41d4-a716-446655440001";

const sampleProject: Project = {
  id: VALID_UUID,
  name: "Test Project",
  description: "A test project description",
  status: "Planned",
  priority: "Medium",
  startDate: "2024-01-01T00:00:00.000Z",
  dueDate: "2024-06-01T00:00:00.000Z",
  progress: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const sampleProjectWithTasks: ProjectWithTasks = {
  ...sampleProject,
  tasks: [
    {
      id: VALID_UUID_2,
      title: "Task 1",
      description: "Task description",
      status: "Todo",
      priority: "High",
      dueDate: "2024-03-01T00:00:00.000Z",
      assignedTo: "John",
      projectId: VALID_UUID,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Projects API Integration Tests", () => {
  describe("POST /api/projects", () => {
    it("should create a project with valid data and return 201", async () => {
      const input = {
        name: "New Project",
        description: "Project description",
        priority: "High",
        startDate: "2024-01-01",
        dueDate: "2024-06-01",
      };

      const created = {
        ...sampleProject,
        name: "New Project",
        description: "Project description",
        priority: "High" as const,
      };
      mockRepo.create.mockResolvedValue(created);

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.name).toBe("New Project");
      expect(body.priority).toBe("High");
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Project",
          status: "Planned",
          progress: 0,
        })
      );
    });

    it("should return 400 when name is missing", async () => {
      const input = { priority: "High" };

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 when name exceeds 100 characters", async () => {
      const input = {
        name: "a".repeat(101),
        priority: "High",
      };

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 when name is empty after trimming", async () => {
      const input = { name: "   ", priority: "Medium" };

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 when priority is invalid", async () => {
      const input = { name: "Test", priority: "Critical" };

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 when dueDate is earlier than startDate", async () => {
      const input = {
        name: "Project",
        priority: "Low",
        startDate: "2024-06-01",
        dueDate: "2024-01-01",
      };

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 when description exceeds 500 characters", async () => {
      const input = {
        name: "Project",
        priority: "Medium",
        description: "x".repeat(501),
      };

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 when body is missing", async () => {
      const req = new NextRequest(new URL("/api/projects", "http://localhost:3000"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const res = await createProject(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
      expect(body.message).toContain("invalid or missing");
    });

    it("should return 400 when unknown fields are provided", async () => {
      const input = {
        name: "Project",
        priority: "High",
        unknownField: "value",
      };

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should default status to Planned on creation", async () => {
      const input = { name: "Project", priority: "Medium" };
      mockRepo.create.mockResolvedValue(sampleProject);

      const req = createJsonRequest("/api/projects", input);
      await createProject(req, createContext({}));

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Planned", progress: 0 })
      );
    });

    it("should accept case-insensitive priority values", async () => {
      const input = { name: "Project", priority: "high" };
      mockRepo.create.mockResolvedValue({ ...sampleProject, priority: "High" });

      const req = createJsonRequest("/api/projects", input);
      const res = await createProject(req, createContext({}));

      expect(res.status).toBe(201);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "High" })
      );
    });
  });

  describe("GET /api/projects", () => {
    it("should return all projects with 200", async () => {
      mockRepo.findAll.mockResolvedValue([sampleProject]);

      const req = createRequest("/api/projects");
      const res = await getProjects(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe("Test Project");
    });

    it("should return empty array when no projects exist", async () => {
      mockRepo.findAll.mockResolvedValue([]);

      const req = createRequest("/api/projects");
      const res = await getProjects(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("should pass search parameter to repository", async () => {
      mockRepo.findAll.mockResolvedValue([sampleProject]);

      const req = createRequest("/api/projects?search=test");
      const res = await getProjects(req, createContext({}));

      expect(res.status).toBe(200);
      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "test" })
      );
    });

    it("should pass status filter to repository", async () => {
      mockRepo.findAll.mockResolvedValue([sampleProject]);

      const req = createRequest("/api/projects?status=Planned");
      const res = await getProjects(req, createContext({}));

      expect(res.status).toBe(200);
      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Planned" })
      );
    });

    it("should return 400 for invalid status filter", async () => {
      const req = createRequest("/api/projects?status=InvalidStatus");
      const res = await getProjects(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should pass priority filter to repository", async () => {
      mockRepo.findAll.mockResolvedValue([sampleProject]);

      const req = createRequest("/api/projects?priority=High");
      const res = await getProjects(req, createContext({}));

      expect(res.status).toBe(200);
      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "High" })
      );
    });

    it("should return 400 for invalid priority filter", async () => {
      const req = createRequest("/api/projects?priority=Critical");
      const res = await getProjects(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 for empty priority filter", async () => {
      const req = createRequest("/api/projects?priority=");
      const res = await getProjects(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should pass sortBy dueDate to repository", async () => {
      mockRepo.findAll.mockResolvedValue([sampleProject]);

      const req = createRequest("/api/projects?sortBy=dueDate&sortOrder=desc");
      const res = await getProjects(req, createContext({}));

      expect(res.status).toBe(200);
      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "dueDate", sortOrder: "desc" })
      );
    });

    it("should return 400 for invalid sortBy value", async () => {
      const req = createRequest("/api/projects?sortBy=name");
      const res = await getProjects(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 for invalid sortOrder value", async () => {
      const req = createRequest("/api/projects?sortBy=dueDate&sortOrder=random");
      const res = await getProjects(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 when search exceeds 200 characters", async () => {
      const longSearch = "a".repeat(201);
      const req = createRequest(`/api/projects?search=${longSearch}`);
      const res = await getProjects(req, createContext({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should handle case-insensitive status filter", async () => {
      mockRepo.findAll.mockResolvedValue([]);

      const req = createRequest("/api/projects?status=in+progress");
      const res = await getProjects(req, createContext({}));

      expect(res.status).toBe(200);
      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: "In Progress" })
      );
    });
  });

  describe("GET /api/projects/:id", () => {
    it("should return project with tasks for valid UUID", async () => {
      mockRepo.findById.mockResolvedValue(sampleProjectWithTasks);

      const req = createRequest(`/api/projects/${VALID_UUID}`);
      const res = await getProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.id).toBe(VALID_UUID);
      expect(body.name).toBe("Test Project");
      expect(body.tasks).toHaveLength(1);
      expect(body.tasks[0].title).toBe("Task 1");
    });

    it("should return 404 when project does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      const req = createRequest(`/api/projects/${VALID_UUID}`);
      const res = await getProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe("NotFoundError");
      expect(body.message).toContain("not found");
    });

    it("should return 400 for invalid UUID format", async () => {
      const invalidId = "not-a-uuid";

      const req = createRequest(`/api/projects/${invalidId}`);
      const res = await getProject(req, createContext({ id: invalidId }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
      expect(body.message).toContain("Invalid identifier");
    });
  });

  describe("PUT /api/projects/:id", () => {
    it("should update project with valid data and return 200", async () => {
      mockRepo.findById.mockResolvedValue(sampleProjectWithTasks);
      mockRepo.update.mockResolvedValue({ ...sampleProject, name: "Updated Name" });

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { name: "Updated Name" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.name).toBe("Updated Name");
    });

    it("should return 404 when updating non-existent project", async () => {
      mockRepo.findById.mockResolvedValue(null);

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { name: "Updated" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe("NotFoundError");
    });

    it("should return 400 for invalid UUID on update", async () => {
      const req = createJsonRequest(
        "/api/projects/bad-id",
        { name: "Updated" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: "bad-id" }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 for invalid status transition (TransitionError)", async () => {
      // Project is "Planned", cannot go directly to "Completed"
      mockRepo.findById.mockResolvedValue(sampleProjectWithTasks);

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { status: "Completed" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("TransitionError");
      expect(body.currentStatus).toBe("Planned");
      expect(body.attemptedStatus).toBe("Completed");
      expect(body.allowedTransitions).toContain("In Progress");
      expect(body.allowedTransitions).toContain("Cancelled");
    });

    it("should allow valid transition from Planned to In Progress", async () => {
      mockRepo.findById.mockResolvedValue(sampleProjectWithTasks);
      mockRepo.update.mockResolvedValue({ ...sampleProject, status: "In Progress" });

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { status: "In Progress" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe("In Progress");
    });

    it("should set progress to 100 when transitioning to Completed", async () => {
      const inProgressProject: ProjectWithTasks = {
        ...sampleProjectWithTasks,
        status: "In Progress",
        progress: 50,
      };
      mockRepo.findById.mockResolvedValue(inProgressProject);
      mockRepo.update.mockResolvedValue({
        ...sampleProject,
        status: "Completed",
        progress: 100,
      });

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { status: "Completed" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.progress).toBe(100);
      expect(mockRepo.update).toHaveBeenCalledWith(
        VALID_UUID,
        expect.objectContaining({ progress: 100 })
      );
    });

    it("should return 400 for validation error on update (name too long)", async () => {
      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { name: "a".repeat(101) },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should return 400 when body is missing on update", async () => {
      const req = new NextRequest(
        new URL(`/api/projects/${VALID_UUID}`, "http://localhost:3000"),
        { method: "PUT", headers: { "Content-Type": "application/json" } }
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should reject unknown fields on update", async () => {
      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { name: "Valid", unknownField: "bad" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });

    it("should allow valid transition from In Progress to On Hold", async () => {
      const inProgressProject: ProjectWithTasks = {
        ...sampleProjectWithTasks,
        status: "In Progress",
      };
      mockRepo.findById.mockResolvedValue(inProgressProject);
      mockRepo.update.mockResolvedValue({ ...sampleProject, status: "On Hold" });

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { status: "On Hold" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe("On Hold");
    });

    it("should allow valid transition from On Hold to In Progress", async () => {
      const onHoldProject: ProjectWithTasks = {
        ...sampleProjectWithTasks,
        status: "On Hold",
      };
      mockRepo.findById.mockResolvedValue(onHoldProject);
      mockRepo.update.mockResolvedValue({ ...sampleProject, status: "In Progress" });

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { status: "In Progress" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe("In Progress");
    });

    it("should reject transition from Completed (terminal state)", async () => {
      const completedProject: ProjectWithTasks = {
        ...sampleProjectWithTasks,
        status: "Completed",
        progress: 100,
      };
      mockRepo.findById.mockResolvedValue(completedProject);

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { status: "In Progress" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("TransitionError");
      expect(body.allowedTransitions).toEqual([]);
    });

    it("should reject transition from Cancelled (terminal state)", async () => {
      const cancelledProject: ProjectWithTasks = {
        ...sampleProjectWithTasks,
        status: "Cancelled",
      };
      mockRepo.findById.mockResolvedValue(cancelledProject);

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { status: "Planned" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("TransitionError");
    });

    it("should allow Planned to Cancelled transition", async () => {
      mockRepo.findById.mockResolvedValue(sampleProjectWithTasks);
      mockRepo.update.mockResolvedValue({ ...sampleProject, status: "Cancelled" });

      const req = createJsonRequest(
        `/api/projects/${VALID_UUID}`,
        { status: "Cancelled" },
        "PUT"
      );
      const res = await updateProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe("Cancelled");
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it("should delete project and return 200 with id", async () => {
      mockRepo.findById.mockResolvedValue(sampleProjectWithTasks);
      mockRepo.delete.mockResolvedValue(sampleProject);

      const req = createRequest(`/api/projects/${VALID_UUID}`);
      const res = await deleteProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.id).toBe(VALID_UUID);
      expect(mockRepo.delete).toHaveBeenCalledWith(VALID_UUID);
    });

    it("should return 404 when deleting non-existent project", async () => {
      mockRepo.findById.mockResolvedValue(null);

      const req = createRequest(`/api/projects/${VALID_UUID}`);
      const res = await deleteProject(req, createContext({ id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe("NotFoundError");
    });

    it("should return 400 for invalid UUID on delete", async () => {
      const req = createRequest("/api/projects/invalid-id");
      const res = await deleteProject(req, createContext({ id: "invalid-id" }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("ValidationError");
    });
  });
});
