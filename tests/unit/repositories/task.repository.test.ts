import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskStatus as PrismaTaskStatus, Priority as PrismaPriority } from "@prisma/client";

// Mock the Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { TaskRepository } from "@/repositories/task.repository";

const mockPrisma = prisma as unknown as {
  task: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

describe("TaskRepository", () => {
  let repository: TaskRepository;

  const mockTaskRecord = {
    id: "task-uuid-1",
    title: "Test Task",
    description: "A description",
    status: PrismaTaskStatus.Todo,
    priority: PrismaPriority.High,
    dueDate: new Date("2024-06-15"),
    assignedTo: "Alice",
    projectId: "project-uuid-1",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-02T00:00:00Z"),
  };

  const mockTaskRecordNullDueDate = {
    ...mockTaskRecord,
    id: "task-uuid-2",
    dueDate: null,
    description: null,
    assignedTo: null,
  };

  beforeEach(() => {
    repository = new TaskRepository();
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return all tasks when no params provided", async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockTaskRecord]);

      const result = await repository.findAll({});

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: undefined,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "task-uuid-1",
        title: "Test Task",
        description: "A description",
        status: "Todo",
        priority: "High",
        dueDate: new Date("2024-06-15").toISOString(),
        assignedTo: "Alice",
        projectId: "project-uuid-1",
        createdAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        updatedAt: new Date("2024-01-02T00:00:00Z").toISOString(),
      });
    });

    it("should apply search filter on title and description", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await repository.findAll({ search: "test" });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: "test", mode: "insensitive" } },
            { description: { contains: "test", mode: "insensitive" } },
          ],
        },
        orderBy: undefined,
      });
    });

    it("should ignore whitespace-only search", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await repository.findAll({ search: "   " });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: undefined,
      });
    });

    it("should apply status filter", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await repository.findAll({ status: "In Progress" });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { status: PrismaTaskStatus.InProgress },
        orderBy: undefined,
      });
    });

    it("should apply priority filter", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await repository.findAll({ priority: "Low" });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { priority: PrismaPriority.Low },
        orderBy: undefined,
      });
    });

    it("should sort by dueDate ascending with nulls last", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await repository.findAll({ sortBy: "dueDate", sortOrder: "asc" });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }],
      });
    });

    it("should sort by dueDate descending with nulls first", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await repository.findAll({ sortBy: "dueDate", sortOrder: "desc" });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ dueDate: { sort: "desc", nulls: "first" } }],
      });
    });

    it("should default sortOrder to asc when sortBy is dueDate", async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);

      await repository.findAll({ sortBy: "dueDate" });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }],
      });
    });

    it("should map null dueDate correctly", async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockTaskRecordNullDueDate]);

      const result = await repository.findAll({});

      expect(result[0].dueDate).toBeNull();
      expect(result[0].description).toBeNull();
      expect(result[0].assignedTo).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return a task when found", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskRecord);

      const result = await repository.findById("task-uuid-1");

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: "task-uuid-1" },
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe("task-uuid-1");
      expect(result!.status).toBe("Todo");
    });

    it("should return null when task not found", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a task with all fields", async () => {
      mockPrisma.task.create.mockResolvedValue(mockTaskRecord);

      const result = await repository.create({
        title: "Test Task",
        description: "A description",
        status: "Todo",
        priority: "High",
        dueDate: "2024-06-15",
        assignedTo: "Alice",
        projectId: "project-uuid-1",
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "Test Task",
          description: "A description",
          status: PrismaTaskStatus.Todo,
          priority: PrismaPriority.High,
          dueDate: new Date("2024-06-15"),
          assignedTo: "Alice",
          projectId: "project-uuid-1",
        },
      });
      expect(result.id).toBe("task-uuid-1");
    });

    it("should default status to Todo when not provided", async () => {
      mockPrisma.task.create.mockResolvedValue(mockTaskRecord);

      await repository.create({
        title: "Task",
        priority: "Medium",
        projectId: "project-uuid-1",
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: "Task",
          description: null,
          status: PrismaTaskStatus.Todo,
          priority: PrismaPriority.Medium,
          dueDate: null,
          assignedTo: null,
          projectId: "project-uuid-1",
        },
      });
    });
  });

  describe("update", () => {
    it("should update only provided fields", async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...mockTaskRecord,
        title: "Updated Title",
      });

      await repository.update("task-uuid-1", { title: "Updated Title" });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-uuid-1" },
        data: { title: "Updated Title" },
      });
    });

    it("should handle status update", async () => {
      mockPrisma.task.update.mockResolvedValue({
        ...mockTaskRecord,
        status: PrismaTaskStatus.InProgress,
      });

      await repository.update("task-uuid-1", { status: "In Progress" });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-uuid-1" },
        data: { status: PrismaTaskStatus.InProgress },
      });
    });

    it("should handle projectId update using connect", async () => {
      mockPrisma.task.update.mockResolvedValue(mockTaskRecord);

      await repository.update("task-uuid-1", { projectId: "new-project-id" });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-uuid-1" },
        data: { project: { connect: { id: "new-project-id" } } },
      });
    });
  });

  describe("delete", () => {
    it("should delete a task and return the deleted record", async () => {
      mockPrisma.task.delete.mockResolvedValue(mockTaskRecord);

      const result = await repository.delete("task-uuid-1");

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: "task-uuid-1" },
      });
      expect(result.id).toBe("task-uuid-1");
    });
  });

  describe("countByProjectAndStatus", () => {
    it("should count tasks by project and status", async () => {
      mockPrisma.task.count.mockResolvedValue(5);

      const result = await repository.countByProjectAndStatus("project-uuid-1", "Done");

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          projectId: "project-uuid-1",
          status: PrismaTaskStatus.Done,
        },
      });
      expect(result).toBe(5);
    });
  });

  describe("countByProject", () => {
    it("should count all tasks for a project", async () => {
      mockPrisma.task.count.mockResolvedValue(10);

      const result = await repository.countByProject("project-uuid-1");

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: { projectId: "project-uuid-1" },
      });
      expect(result).toBe(10);
    });
  });

  describe("findOverdue", () => {
    it("should count overdue tasks (dueDate < today and status not Done)", async () => {
      const today = new Date("2024-06-01");
      mockPrisma.task.count.mockResolvedValue(3);

      const result = await repository.findOverdue(today);

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: {
          dueDate: { lt: today },
          status: { not: PrismaTaskStatus.Done },
        },
      });
      expect(result).toBe(3);
    });
  });

  describe("findUpcomingDeadlines", () => {
    it("should find tasks with upcoming deadlines including project relation", async () => {
      const today = new Date("2024-06-01");
      const endDate = new Date("2024-06-08");

      const recordWithProject = {
        ...mockTaskRecord,
        project: {
          id: "project-uuid-1",
          name: "Test Project",
          description: "Project description",
          status: "Planned" as const,
          priority: PrismaPriority.High,
          startDate: null,
          dueDate: null,
          progress: 0,
          createdAt: new Date("2024-01-01T00:00:00Z"),
          updatedAt: new Date("2024-01-01T00:00:00Z"),
        },
      };

      mockPrisma.task.findMany.mockResolvedValue([recordWithProject]);

      const result = await repository.findUpcomingDeadlines(today, endDate, 20);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          dueDate: {
            gte: today,
            lte: endDate,
          },
        },
        orderBy: { dueDate: "asc" },
        take: 20,
        include: { project: true },
      });
      expect(result).toHaveLength(1);
      expect(result[0].project.name).toBe("Test Project");
      expect(result[0].project.status).toBe("Planned");
    });
  });
});
