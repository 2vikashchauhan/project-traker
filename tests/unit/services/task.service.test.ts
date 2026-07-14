import { describe, it, expect, vi, beforeEach } from "vitest";

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
  },
}));

vi.mock("@/repositories/project.repository", () => ({
  projectRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

import { taskRepository } from "@/repositories/task.repository";
import { projectRepository } from "@/repositories/project.repository";
import { taskService } from "@/services/task.service";
import { NotFoundError, TransitionError } from "@/lib/errors";
import { Task } from "@/types/task.types";

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

const sampleTask: Task = {
  id: "task-1",
  title: "Sample Task",
  description: "A test task",
  status: "Todo",
  priority: "Medium",
  dueDate: "2024-06-15T00:00:00.000Z",
  assignedTo: "Alice",
  projectId: "project-1",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const sampleProject = {
  id: "project-1",
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

describe("TaskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listTasks", () => {
    it("should delegate to taskRepository.findAll with params", async () => {
      const tasks = [sampleTask];
      mockTaskRepo.findAll.mockResolvedValue(tasks);

      const params = { search: "sample", status: "Todo" };
      const result = await taskService.listTasks(params);

      expect(mockTaskRepo.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual(tasks);
    });

    it("should return empty array when no tasks match", async () => {
      mockTaskRepo.findAll.mockResolvedValue([]);

      const result = await taskService.listTasks({});

      expect(result).toEqual([]);
    });
  });

  describe("getTaskById", () => {
    it("should return the task when found", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);

      const result = await taskService.getTaskById("task-1");

      expect(mockTaskRepo.findById).toHaveBeenCalledWith("task-1");
      expect(result).toEqual(sampleTask);
    });

    it("should throw NotFoundError when task does not exist", async () => {
      mockTaskRepo.findById.mockResolvedValue(null);

      await expect(taskService.getTaskById("nonexistent")).rejects.toThrow(NotFoundError);
      await expect(taskService.getTaskById("nonexistent")).rejects.toThrow(
        "Task with identifier 'nonexistent' was not found"
      );
    });
  });

  describe("createTask", () => {
    it("should create a task when project exists", async () => {
      mockProjectRepo.findById.mockResolvedValue(sampleProject);
      mockTaskRepo.create.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(5);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(2);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const input = {
        title: "Sample Task",
        priority: "Medium" as const,
        projectId: "project-1",
      };

      const result = await taskService.createTask(input);

      expect(mockProjectRepo.findById).toHaveBeenCalledWith("project-1");
      expect(mockTaskRepo.create).toHaveBeenCalledWith({
        ...input,
        status: "Todo",
      });
      expect(result).toEqual(sampleTask);
    });

    it("should default status to Todo if not provided", async () => {
      mockProjectRepo.findById.mockResolvedValue(sampleProject);
      mockTaskRepo.create.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(1);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(0);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const input = {
        title: "New Task",
        priority: "Low" as const,
        projectId: "project-1",
      };

      await taskService.createTask(input);

      expect(mockTaskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Todo" })
      );
    });

    it("should throw NotFoundError when project does not exist", async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      const input = {
        title: "New Task",
        priority: "Low" as const,
        projectId: "nonexistent-project",
      };

      await expect(taskService.createTask(input)).rejects.toThrow(NotFoundError);
      await expect(taskService.createTask(input)).rejects.toThrow(
        "Project with identifier 'nonexistent-project' was not found"
      );
    });

    it("should recalculate project progress after creation", async () => {
      mockProjectRepo.findById.mockResolvedValue(sampleProject);
      mockTaskRepo.create.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(4);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(1);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      await taskService.createTask({
        title: "Task",
        priority: "High" as const,
        projectId: "project-1",
      });

      expect(mockTaskRepo.countByProject).toHaveBeenCalledWith("project-1");
      expect(mockTaskRepo.countByProjectAndStatus).toHaveBeenCalledWith("project-1", "Done");
      // floor(1/4 * 100) = 25
      expect(mockProjectRepo.update).toHaveBeenCalledWith("project-1", { progress: 25 });
    });
  });

  describe("updateTask", () => {
    it("should update a task with valid data", async () => {
      const updatedTask = { ...sampleTask, title: "Updated Title" };
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);

      const result = await taskService.updateTask("task-1", { title: "Updated Title" });

      expect(mockTaskRepo.update).toHaveBeenCalledWith("task-1", { title: "Updated Title" });
      expect(result).toEqual(updatedTask);
    });

    it("should throw NotFoundError when task does not exist", async () => {
      mockTaskRepo.findById.mockResolvedValue(null);

      await expect(
        taskService.updateTask("nonexistent", { title: "Test" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should verify new project exists when projectId is changed", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(
        taskService.updateTask("task-1", { projectId: "new-project" })
      ).rejects.toThrow(NotFoundError);
      await expect(
        taskService.updateTask("task-1", { projectId: "new-project" })
      ).rejects.toThrow("Project with identifier 'new-project' was not found");
    });

    it("should validate status transition and throw TransitionError for invalid ones", async () => {
      // Task is in "Todo" status, trying to move to "Done" (invalid)
      mockTaskRepo.findById.mockResolvedValue(sampleTask);

      await expect(
        taskService.updateTask("task-1", { status: "Done" })
      ).rejects.toThrow(TransitionError);

      try {
        await taskService.updateTask("task-1", { status: "Done" });
      } catch (err) {
        const error = err as TransitionError;
        expect(error.currentStatus).toBe("Todo");
        expect(error.attemptedStatus).toBe("Done");
        expect(error.allowedTransitions).toEqual(["In Progress"]);
      }
    });

    it("should allow valid status transition from Todo to In Progress", async () => {
      const updatedTask = { ...sampleTask, status: "In Progress" as const };
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);
      mockTaskRepo.countByProject.mockResolvedValue(3);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(0);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.updateTask("task-1", { status: "In Progress" });

      expect(result.status).toBe("In Progress");
    });

    it("should recalculate project progress when status changes", async () => {
      const updatedTask = { ...sampleTask, status: "In Progress" as const };
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.update.mockResolvedValue(updatedTask);
      mockTaskRepo.countByProject.mockResolvedValue(5);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(2);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      await taskService.updateTask("task-1", { status: "In Progress" });

      expect(mockTaskRepo.countByProject).toHaveBeenCalledWith("project-1");
      expect(mockTaskRepo.countByProjectAndStatus).toHaveBeenCalledWith("project-1", "Done");
      // floor(2/5 * 100) = 40
      expect(mockProjectRepo.update).toHaveBeenCalledWith("project-1", { progress: 40 });
    });

    it("should not recalculate progress when status does not change", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.update.mockResolvedValue({ ...sampleTask, title: "New Title" });

      await taskService.updateTask("task-1", { title: "New Title" });

      expect(mockTaskRepo.countByProject).not.toHaveBeenCalled();
      expect(mockProjectRepo.update).not.toHaveBeenCalled();
    });

    it("should not verify project if projectId same as existing", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.update.mockResolvedValue(sampleTask);

      await taskService.updateTask("task-1", { projectId: "project-1" });

      // findById should only be called for the task lookup, not for project verification
      expect(mockProjectRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe("deleteTask", () => {
    it("should delete the task and return its id", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.delete.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(3);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(1);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.deleteTask("task-1");

      expect(result).toEqual({ id: "task-1" });
      expect(mockTaskRepo.delete).toHaveBeenCalledWith("task-1");
    });

    it("should throw NotFoundError when task does not exist", async () => {
      mockTaskRepo.findById.mockResolvedValue(null);

      await expect(taskService.deleteTask("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("should recalculate project progress after deletion", async () => {
      mockTaskRepo.findById.mockResolvedValue(sampleTask);
      mockTaskRepo.delete.mockResolvedValue(sampleTask);
      mockTaskRepo.countByProject.mockResolvedValue(2);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(1);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      await taskService.deleteTask("task-1");

      expect(mockTaskRepo.countByProject).toHaveBeenCalledWith("project-1");
      expect(mockTaskRepo.countByProjectAndStatus).toHaveBeenCalledWith("project-1", "Done");
      // floor(1/2 * 100) = 50
      expect(mockProjectRepo.update).toHaveBeenCalledWith("project-1", { progress: 50 });
    });
  });

  describe("recalculateProjectProgress", () => {
    it("should calculate progress as floor(done/total * 100)", async () => {
      mockTaskRepo.countByProject.mockResolvedValue(10);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(3);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.recalculateProjectProgress("project-1");

      // floor(3/10 * 100) = 30
      expect(result).toBe(30);
      expect(mockProjectRepo.update).toHaveBeenCalledWith("project-1", { progress: 30 });
    });

    it("should return 0 when project has no tasks", async () => {
      mockTaskRepo.countByProject.mockResolvedValue(0);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(0);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.recalculateProjectProgress("project-1");

      expect(result).toBe(0);
      expect(mockProjectRepo.update).toHaveBeenCalledWith("project-1", { progress: 0 });
    });

    it("should return 100 when all tasks are done", async () => {
      mockTaskRepo.countByProject.mockResolvedValue(5);
      mockTaskRepo.countByProjectAndStatus.mockResolvedValue(5);
      mockProjectRepo.update.mockResolvedValue(sampleProject);

      const result = await taskService.recalculateProjectProgress("project-1");

      expect(result).toBe(100);
      expect(mockProjectRepo.update).toHaveBeenCalledWith("project-1", { progress: 100 });
    });
  });
});
