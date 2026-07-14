import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTaskSchema, updateTaskSchema } from "@/validators/task.validator";
import { taskQueryParamsSchema, uuidSchema } from "@/validators/common.validator";
import { taskService } from "@/services/task.service";
import { NotFoundError, TransitionError, ValidationError } from "@/lib/errors";
import { Task } from "@/types/task.types";

/**
 * Integration tests for the Tasks API.
 * Tests the validation → service → (mocked) repository flow.
 *
 * Requirements covered:
 * 7.1–7.11, 8.1–8.6, 9.1–9.7, 10.1–10.5, 11.1–11.5, 14.1–14.5, 15.2, 16.2, 17.2
 */

// Mock the repository modules
vi.mock("@/repositories/task.repository", () => ({
  taskRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByProject: vi.fn(),
    countByProjectAndStatus: vi.fn(),
    findOverdue: vi.fn(),
    findUpcomingDeadlines: vi.fn(),
  },
}));

vi.mock("@/repositories/project.repository", () => ({
  projectRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByStatus: vi.fn(),
    countAll: vi.fn(),
    getAverageProgress: vi.fn(),
  },
}));

import { taskRepository } from "@/repositories/task.repository";
import { projectRepository } from "@/repositories/project.repository";

const mockTaskRepo = taskRepository as unknown as {
  findAll: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  countByProject: ReturnType<typeof vi.fn>;
  countByProjectAndStatus: ReturnType<typeof vi.fn>;
};

const mockProjectRepo = projectRepository as unknown as {
  findById: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

// --- Test fixtures ---
const VALID_UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const VALID_PROJECT_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const INVALID_UUID = "not-a-uuid";

const sampleProject = {
  id: VALID_PROJECT_ID,
  name: "Test Project",
  description: null,
  status: "In Progress" as const,
  priority: "High" as const,
  startDate: null,
  dueDate: null,
  progress: 50,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  tasks: [],
};

const sampleTask: Task = {
  id: VALID_UUID,
  title: "Integration Test Task",
  description: "A task for integration testing",
  status: "Todo",
  priority: "Medium",
  dueDate: "2024-06-15T00:00:00.000Z",
  assignedTo: "Alice",
  projectId: VALID_PROJECT_ID,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("Tasks API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── POST /api/tasks ─────────────────────────────────────────────

  describe("POST /api/tasks - Task Creation", () => {
    it("should create a task with valid input and return 201-equivalent response (Req 7.1, 7.3)", async () => {
      mockProjectRepo.findById.mockResolvedValue(sampleProject);
      mockTaskRepo.create.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(1);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(0);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const input = {
        title: "Integration Test Task",
        description: "A task for integration testing",
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
        dueDate: "2024-06-15T00:00:00.000Z",
        assignedTo: "Alice",
      };

      // Validate input through Zod schema
      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(true);

      // Call service
      const result = await taskService.createTask(parsed.data!);
      expect(result).toEqual(sampleTask);
      expect(result.id).toBeDefined();
      expect(result.status).toBe("Todo");
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should default status to Todo when not provided (Req 7.3)", async () => {
      mockProjectRepo.findById.mockResolvedValue(sampleProject);
      const createdTask = { ...sampleTask, status: "Todo" as const };
      mockTaskRepo.create.mockResolvedValue(createdTask);
      mockTaskRepo.countByProject.mockResolvedValue(1);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(0);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const input = {
        title: "No Status Task",
        priority: "Low",
        projectId: VALID_PROJECT_ID,
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.status).toBe("Todo");

      const result = await taskService.createTask(parsed.data!);
      expect(result.status).toBe("Todo");
    });

    it("should reject creation with empty title (Req 7.4, 7.10)", () => {
      const input = {
        title: "",
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });

    it("should reject creation with whitespace-only title (Req 7.4)", () => {
      const input = {
        title: "   ",
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });

    it("should reject creation with title exceeding 150 characters (Req 7.5)", () => {
      const input = {
        title: "a".repeat(151),
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });

    it("should reject creation with invalid priority (Req 7.6)", () => {
      const input = {
        title: "Valid Title",
        priority: "Critical",
        projectId: VALID_PROJECT_ID,
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });

    it("should reject creation with invalid projectId format (Req 7.7)", () => {
      const input = {
        title: "Valid Title",
        priority: "Medium",
        projectId: "not-a-uuid",
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });

    it("should return 404 when project does not exist (Req 7.8)", async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      const input = {
        title: "Task for missing project",
        priority: "High",
        projectId: VALID_PROJECT_ID,
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(true);

      await expect(taskService.createTask(parsed.data!)).rejects.toThrow(NotFoundError);
    });

    it("should reject creation with description exceeding 1000 characters (Req 7.11)", () => {
      const input = {
        title: "Valid Title",
        description: "x".repeat(1001),
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });

    it("should reject creation with unknown fields (Req 19.4)", () => {
      const input = {
        title: "Valid Title",
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
        unknownField: "should be rejected",
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });

    it("should trim whitespace from title (Req 19.3)", () => {
      const input = {
        title: "  Trimmed Title  ",
        priority: "High",
        projectId: VALID_PROJECT_ID,
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.title).toBe("Trimmed Title");
    });

    it("should accept valid assignedTo field (Req 12.4)", () => {
      const input = {
        title: "Assigned Task",
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
        assignedTo: "Bob",
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.assignedTo).toBe("Bob");
    });

    it("should accept null assignedTo (Req 12.3)", () => {
      const input = {
        title: "Unassigned Task",
        priority: "Low",
        projectId: VALID_PROJECT_ID,
        assignedTo: null,
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(true);
      expect(parsed.data!.assignedTo).toBeNull();
    });

    it("should reject assignedTo exceeding 100 characters", () => {
      const input = {
        title: "Task",
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
        assignedTo: "a".repeat(101),
      };

      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(false);
    });
  });

  // ─── GET /api/tasks ──────────────────────────────────────────────

  describe("GET /api/tasks - Task Listing", () => {
    it("should return all tasks (Req 8.1, 8.5)", async () => {
      const tasks = [sampleTask, { ...sampleTask, id: "task-2", title: "Second Task" }];
      mockTaskRepo.findAll.mockResolvedValue(tasks);

      const result = await taskService.listTasks({});
      expect(result).toHaveLength(2);
      expect(result[0].id).toBeDefined();
      expect(result[0].title).toBeDefined();
      expect(result[0].status).toBeDefined();
      expect(result[0].priority).toBeDefined();
      expect(result[0].projectId).toBeDefined();
    });

    it("should filter tasks by search term - title match (Req 14.1)", async () => {
      const filteredTasks = [sampleTask];
      mockTaskRepo.findAll.mockResolvedValue(filteredTasks);

      const params = { search: "Integration" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);

      const result = await taskService.listTasks(parsedParams.data!);
      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Integration" })
      );
      expect(result).toHaveLength(1);
    });

    it("should return empty list when search matches nothing (Req 14.2)", async () => {
      mockTaskRepo.findAll.mockResolvedValue([]);

      const result = await taskService.listTasks({ search: "nonexistent" });
      expect(result).toEqual([]);
    });

    it("should ignore empty/whitespace search and return all (Req 14.4)", () => {
      const params = { search: "   " };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);
      // After trim, empty string - should be treated as no search
      expect(parsedParams.data!.search).toBe("");
    });

    it("should reject search query exceeding 200 characters (Req 14.5)", () => {
      const params = { search: "a".repeat(201) };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(false);
    });

    it("should filter tasks by status (Req 15.2)", async () => {
      const todoTasks = [sampleTask];
      mockTaskRepo.findAll.mockResolvedValue(todoTasks);

      const params = { status: "Todo" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);

      const result = await taskService.listTasks(parsedParams.data!);
      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Todo" })
      );
    });

    it("should accept case-insensitive status filter (Req 15.2)", () => {
      const params = { status: "in progress" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);
      expect(parsedParams.data!.status).toBe("In Progress");
    });

    it("should reject invalid status filter (Req 15.3)", () => {
      const params = { status: "InvalidStatus" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(false);
    });

    it("should filter tasks by priority (Req 16.2)", async () => {
      mockTaskRepo.findAll.mockResolvedValue([sampleTask]);

      const params = { priority: "Medium" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);

      const result = await taskService.listTasks(parsedParams.data!);
      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "Medium" })
      );
    });

    it("should accept case-insensitive priority filter (Req 16.2)", () => {
      const params = { priority: "high" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);
      expect(parsedParams.data!.priority).toBe("High");
    });

    it("should reject invalid priority filter (Req 16.3)", () => {
      const params = { priority: "Urgent" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(false);
    });

    it("should reject empty string priority filter (Req 16.6)", () => {
      const params = { priority: "" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(false);
    });

    it("should sort tasks by dueDate ascending (Req 17.2)", async () => {
      mockTaskRepo.findAll.mockResolvedValue([sampleTask]);

      const params = { sortBy: "dueDate", sortOrder: "asc" as const };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);

      await taskService.listTasks(parsedParams.data!);
      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "dueDate", sortOrder: "asc" })
      );
    });

    it("should sort tasks by dueDate descending (Req 17.2)", async () => {
      mockTaskRepo.findAll.mockResolvedValue([sampleTask]);

      const params = { sortBy: "dueDate", sortOrder: "desc" as const };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);

      await taskService.listTasks(parsedParams.data!);
      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "dueDate", sortOrder: "desc" })
      );
    });

    it("should reject invalid sortBy value (Req 17.6)", () => {
      const params = { sortBy: "name" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(false);
    });

    it("should reject invalid sortOrder value (Req 17.7)", () => {
      const params = { sortBy: "dueDate", sortOrder: "random" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(false);
    });
  });

  // ─── GET /api/tasks/:id ──────────────────────────────────────────

  describe("GET /api/tasks/:id - Task Retrieval", () => {
    it("should return task details for a valid UUID (Req 8.2, 8.6)", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);

      const idParsed = uuidSchema.safeParse(VALID_UUID);
      expect(idParsed.success).toBe(true);

      const result = await taskService.getTaskById(idParsed.data!);
      expect(result).toEqual(sampleTask);
      expect(result.id).toBe(VALID_UUID);
      expect(result.title).toBe("Integration Test Task");
      expect(result.description).toBe("A task for integration testing");
      expect(result.status).toBe("Todo");
      expect(result.priority).toBe("Medium");
      expect(result.projectId).toBe(VALID_PROJECT_ID);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should throw NotFoundError for non-existent task (Req 8.3)", async () => {
      mockTaskRepo.findById.mockResolvedValue(null);

      await expect(taskService.getTaskById(VALID_UUID)).rejects.toThrow(NotFoundError);
      await expect(taskService.getTaskById(VALID_UUID)).rejects.toThrow(
        "Task with identifier"
      );
    });

    it("should reject invalid UUID format (Req 8.4)", () => {
      const result = uuidSchema.safeParse(INVALID_UUID);
      expect(result.success).toBe(false);
    });
  });

  // ─── PUT /api/tasks/:id ──────────────────────────────────────────

  describe("PUT /api/tasks/:id - Task Update", () => {
    it("should update task with valid partial data (Req 9.1)", async () => {
      const updatedTask = { ...sampleTask, title: "Updated Title" };
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);

      const body = { title: "Updated Title" };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(true);

      const result = await taskService.updateTask(VALID_UUID, parsed.data!);
      expect(result.title).toBe("Updated Title");
    });

    it("should reject update with unknown fields (Req 19.4)", () => {
      const body = { title: "Valid", extraField: "nope" };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(false);
    });

    it("should throw NotFoundError for non-existent task (Req 9.4)", async () => {
      mockTaskRepo.findById.mockResolvedValue(null);

      await expect(
        taskService.updateTask(VALID_UUID, { title: "Update" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when updating projectId to non-existent project (Req 9.7)", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockProjectRepo.findById.mockResolvedValue(null);

      const newProjectId = "c3d4e5f6-a7b8-9012-cdef-123456789012";
      await expect(
        taskService.updateTask(VALID_UUID, { projectId: newProjectId })
      ).rejects.toThrow(NotFoundError);
      await expect(
        taskService.updateTask(VALID_UUID, { projectId: newProjectId })
      ).rejects.toThrow("Project");
    });

    it("should update assignedTo field (Req 12.1, 12.2)", async () => {
      const updatedTask = { ...sampleTask, assignedTo: "Bob" };
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);

      const body = { assignedTo: "Bob" };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(true);

      const result = await taskService.updateTask(VALID_UUID, parsed.data!);
      expect(result.assignedTo).toBe("Bob");
    });

    it("should allow setting assignedTo to null (unassign) (Req 12.3, 12.5)", async () => {
      const updatedTask = { ...sampleTask, assignedTo: null };
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);

      const body = { assignedTo: null };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(true);

      const result = await taskService.updateTask(VALID_UUID, parsed.data!);
      expect(result.assignedTo).toBeNull();
    });
  });

  // ─── DELETE /api/tasks/:id ───────────────────────────────────────

  describe("DELETE /api/tasks/:id - Task Deletion", () => {
    it("should delete an existing task and return its id (Req 10.1)", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.delete.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(3);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(1);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.deleteTask(VALID_UUID);
      expect(result).toEqual({ id: VALID_UUID });
    });

    it("should throw NotFoundError for non-existent task (Req 10.3)", async () => {
      mockTaskRepo.findById.mockResolvedValue(null);

      await expect(taskService.deleteTask(VALID_UUID)).rejects.toThrow(NotFoundError);
    });

    it("should reject invalid UUID format for deletion (Req 10.4)", () => {
      const result = uuidSchema.safeParse(INVALID_UUID);
      expect(result.success).toBe(false);
    });

    it("should recalculate project progress after deletion (Req 10.2)", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.delete.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(4);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(2);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      await taskService.deleteTask(VALID_UUID);

      expect(mockTaskRepo.countByProject).toHaveBeenCalledWith(VALID_PROJECT_ID);
      expect(mockTaskRepo.countByProjectAndStatus).toHaveBeenCalledWith(VALID_PROJECT_ID, "Done");
      // floor(2/4 * 100) = 50
      expect(mockProjectRepo.update).toHaveBeenCalledWith(VALID_PROJECT_ID, { progress: 50 });
    });
  });

  // ─── Status Transitions ──────────────────────────────────────────

  describe("Task Status Transitions (Req 11.1–11.5)", () => {
    it("should allow Todo → In Progress (Req 11.2)", async () => {
      const todoTask = { ...sampleTask, status: "Todo" as const };
      const updatedTask = { ...sampleTask, status: "In Progress" as const };
      mockTaskRepo.findById.mockResolvedValue(todoTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);
      mockTaskRepo.countByProject.mockResolvedValue(5);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(1);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.updateTask(VALID_UUID, { status: "In Progress" });
      expect(result.status).toBe("In Progress");
    });

    it("should allow In Progress → Review (Req 11.2)", async () => {
      const inProgressTask = { ...sampleTask, status: "In Progress" as const };
      const updatedTask = { ...sampleTask, status: "Review" as const };
      mockTaskRepo.findById.mockResolvedValue(inProgressTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);
      mockTaskRepo.countByProject.mockResolvedValue(5);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(1);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.updateTask(VALID_UUID, { status: "Review" });
      expect(result.status).toBe("Review");
    });

    it("should allow Review → Done (Req 11.2)", async () => {
      const reviewTask = { ...sampleTask, status: "Review" as const };
      const updatedTask = { ...sampleTask, status: "Done" as const };
      mockTaskRepo.findById.mockResolvedValue(reviewTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);
      mockTaskRepo.countByProject.mockResolvedValue(5);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(2);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.updateTask(VALID_UUID, { status: "Done" });
      expect(result.status).toBe("Done");
    });

    it("should allow Review → In Progress (Req 11.2)", async () => {
      const reviewTask = { ...sampleTask, status: "Review" as const };
      const updatedTask = { ...sampleTask, status: "In Progress" as const };
      mockTaskRepo.findById.mockResolvedValue(reviewTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);
      mockTaskRepo.countByProject.mockResolvedValue(5);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(1);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.updateTask(VALID_UUID, { status: "In Progress" });
      expect(result.status).toBe("In Progress");
    });

    it("should reject Todo → Done (invalid transition) (Req 11.5)", async () => {
      const todoTask = { ...sampleTask, status: "Todo" as const };
      mockTaskRepo.findById.mockResolvedValue(todoTask);

      await expect(
        taskService.updateTask(VALID_UUID, { status: "Done" })
      ).rejects.toThrow(TransitionError);

      try {
        await taskService.updateTask(VALID_UUID, { status: "Done" });
      } catch (err) {
        const error = err as TransitionError;
        expect(error.currentStatus).toBe("Todo");
        expect(error.attemptedStatus).toBe("Done");
        expect(error.allowedTransitions).toEqual(["In Progress"]);
      }
    });

    it("should reject Todo → Review (invalid transition) (Req 11.5)", async () => {
      const todoTask = { ...sampleTask, status: "Todo" as const };
      mockTaskRepo.findById.mockResolvedValue(todoTask);

      await expect(
        taskService.updateTask(VALID_UUID, { status: "Review" })
      ).rejects.toThrow(TransitionError);
    });

    it("should reject In Progress → Done (must go through Review) (Req 11.5)", async () => {
      const inProgressTask = { ...sampleTask, status: "In Progress" as const };
      mockTaskRepo.findById.mockResolvedValue(inProgressTask);

      await expect(
        taskService.updateTask(VALID_UUID, { status: "Done" })
      ).rejects.toThrow(TransitionError);
    });

    it("should reject Done → any status (terminal state) (Req 11.5)", async () => {
      const doneTask = { ...sampleTask, status: "Done" as const };
      mockTaskRepo.findById.mockResolvedValue(doneTask);

      await expect(
        taskService.updateTask(VALID_UUID, { status: "Todo" })
      ).rejects.toThrow(TransitionError);

      await expect(
        taskService.updateTask(VALID_UUID, { status: "In Progress" })
      ).rejects.toThrow(TransitionError);
    });

    it("should reject invalid status value via validator (Req 11.4)", () => {
      const body = { status: "Archived" };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(false);
    });

    it("should only allow Task_Status values: Todo, In Progress, Review, Done (Req 11.1)", () => {
      const validStatuses = ["Todo", "In Progress", "Review", "Done"];
      for (const status of validStatuses) {
        const parsed = updateTaskSchema.safeParse({ status });
        expect(parsed.success).toBe(true);
      }

      const invalidStatuses = ["Planned", "Cancelled", "On Hold", "Completed"];
      for (const status of invalidStatuses) {
        const parsed = updateTaskSchema.safeParse({ status });
        expect(parsed.success).toBe(false);
      }
    });
  });

  // ─── Progress Recalculation ──────────────────────────────────────

  describe("Progress Recalculation (Req 9.5, 10.2)", () => {
    it("should recalculate project progress when task status changes to Done (Req 9.5)", async () => {
      const reviewTask = { ...sampleTask, status: "Review" as const };
      const doneTask = { ...sampleTask, status: "Done" as const };
      mockTaskRepo.findById.mockResolvedValue(reviewTask);
      mockTaskRepo.update.mockResolvedValue(doneTask);
      mockTaskRepo.countByProject.mockResolvedValue(4);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(3);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      await taskService.updateTask(VALID_UUID, { status: "Done" });

      // floor(3/4 * 100) = 75
      expect(mockProjectRepo.update).toHaveBeenCalledWith(VALID_PROJECT_ID, { progress: 75 });
    });

    it("should set progress to 0 when project has no tasks after deletion (Req 18.2)", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.delete.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(0);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(0);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      await taskService.deleteTask(VALID_UUID);

      expect(mockProjectRepo.update).toHaveBeenCalledWith(VALID_PROJECT_ID, { progress: 0 });
    });

    it("should set progress to 100 when all remaining tasks are Done (Req 18.1)", async () => {
      const reviewTask = { ...sampleTask, status: "Review" as const };
      const doneTask = { ...sampleTask, status: "Done" as const };
      mockTaskRepo.findById.mockResolvedValue(reviewTask);
      mockTaskRepo.update.mockResolvedValue(doneTask);
      mockTaskRepo.countByProject.mockResolvedValue(3);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(3);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      await taskService.updateTask(VALID_UUID, { status: "Done" });

      expect(mockProjectRepo.update).toHaveBeenCalledWith(VALID_PROJECT_ID, { progress: 100 });
    });

    it("should recalculate progress on task creation (Req 18.3)", async () => {
      mockProjectRepo.findById.mockResolvedValue(sampleProject);
      mockTaskRepo.create.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(6);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(2);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      await taskService.createTask({
        title: "New Task",
        priority: "Medium",
        projectId: VALID_PROJECT_ID,
      });

      // floor(2/6 * 100) = 33
      expect(mockProjectRepo.update).toHaveBeenCalledWith(VALID_PROJECT_ID, { progress: 33 });
    });

    it("should use floor for progress calculation (Req 18.1)", async () => {
      const reviewTask = { ...sampleTask, status: "Review" as const };
      const doneTask = { ...sampleTask, status: "Done" as const };
      mockTaskRepo.findById.mockResolvedValue(reviewTask);
      mockTaskRepo.update.mockResolvedValue(doneTask);
      mockTaskRepo.countByProject.mockResolvedValue(3);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(1);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      await taskService.updateTask(VALID_UUID, { status: "Done" });

      // floor(1/3 * 100) = 33
      expect(mockProjectRepo.update).toHaveBeenCalledWith(VALID_PROJECT_ID, { progress: 33 });
    });
  });

  // ─── Validation Errors ───────────────────────────────────────────

  describe("Validation Error Responses (Req 7.10, 9.3)", () => {
    it("should provide field-level errors for missing required fields", () => {
      // Missing title and priority
      const input = { projectId: VALID_PROJECT_ID };
      const parsed = createTaskSchema.safeParse(input);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const fieldPaths = parsed.error.errors.map((e) => e.path.join("."));
        expect(fieldPaths).toContain("title");
        expect(fieldPaths).toContain("priority");
      }
    });

    it("should provide error for title too long in update", () => {
      const body = { title: "a".repeat(151) };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const titleError = parsed.error.errors.find((e) => e.path.includes("title"));
        expect(titleError).toBeDefined();
      }
    });

    it("should provide error for invalid priority in update (Req 9.3)", () => {
      const body = { priority: "Extreme" };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const priorityError = parsed.error.errors.find((e) => e.path.includes("priority"));
        expect(priorityError).toBeDefined();
      }
    });

    it("should provide error for invalid status in update (Req 9.3)", () => {
      const body = { status: "NotAStatus" };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const statusError = parsed.error.errors.find((e) => e.path.includes("status"));
        expect(statusError).toBeDefined();
      }
    });

    it("should provide error for invalid dueDate format", () => {
      const body = { dueDate: "not-a-date" };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(false);
    });

    it("should accept valid dueDate in ISO 8601 format", () => {
      const body = { dueDate: "2024-12-31T00:00:00.000Z" };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(true);
    });

    it("should provide error for invalid projectId format in update (Req 9.3)", () => {
      const body = { projectId: "not-a-uuid" };
      const parsed = updateTaskSchema.safeParse(body);
      expect(parsed.success).toBe(false);
    });
  });

  // ─── Combined Search/Filter/Sort ─────────────────────────────────

  describe("Combined Search, Filter, and Sort (Req 14.1, 15.2, 16.2, 17.2)", () => {
    it("should support combined search and status filter", async () => {
      mockTaskRepo.findAll.mockResolvedValue([sampleTask]);

      const params = { search: "Integration", status: "todo" };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);

      await taskService.listTasks(parsedParams.data!);
      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Integration", status: "Todo" })
      );
    });

    it("should support combined priority filter and sort", async () => {
      mockTaskRepo.findAll.mockResolvedValue([sampleTask]);

      const params = { priority: "medium", sortBy: "dueDate", sortOrder: "desc" as const };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);

      await taskService.listTasks(parsedParams.data!);
      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: "Medium",
          sortBy: "dueDate",
          sortOrder: "desc",
        })
      );
    });

    it("should support all filters combined", async () => {
      mockTaskRepo.findAll.mockResolvedValue([]);

      const params = {
        search: "test",
        status: "In Progress",
        priority: "High",
        sortBy: "dueDate",
        sortOrder: "asc" as const,
      };
      const parsedParams = taskQueryParamsSchema.safeParse(params);
      expect(parsedParams.success).toBe(true);

      await taskService.listTasks(parsedParams.data!);
      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "test",
          status: "In Progress",
          priority: "High",
          sortBy: "dueDate",
          sortOrder: "asc",
        })
      );
    });

    it("should return empty list when combined filters match nothing", async () => {
      mockTaskRepo.findAll.mockResolvedValue([]);

      const result = await taskService.listTasks({
        search: "nonexistent",
        status: "Done",
        priority: "Low",
      });

      expect(result).toEqual([]);
    });
  });
});
