import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectService } from "@/services/project.service";
import { ProjectRepository } from "@/repositories/project.repository";
import { NotFoundError, TransitionError } from "@/lib/errors";
import { Project, ProjectWithTasks } from "@/types/project.types";

// Create a mock repository
function createMockRepository() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByStatus: vi.fn(),
    countAll: vi.fn(),
    getAverageProgress: vi.fn(),
  } as unknown as {
    [K in keyof ProjectRepository]: ReturnType<typeof vi.fn>;
  };
}

const baseProject: Project = {
  id: "test-uuid-1",
  name: "Test Project",
  description: "A test project",
  status: "Planned",
  priority: "Medium",
  startDate: "2024-01-01T00:00:00.000Z",
  dueDate: "2024-06-01T00:00:00.000Z",
  progress: 0,
  ownerId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const baseProjectWithTasks: ProjectWithTasks = {
  ...baseProject,
  tasks: [],
};

describe("ProjectService", () => {
  let service: ProjectService;
  let mockRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new ProjectService(mockRepo as unknown as ProjectRepository);
  });

  describe("listProjects", () => {
    it("should delegate to repository.findAll with params", async () => {
      const params = { search: "test", status: "Planned" };
      mockRepo.findAll.mockResolvedValue([baseProject]);

      const result = await service.listProjects(params);

      expect(mockRepo.findAll).toHaveBeenCalledWith(params);
      expect(result).toEqual([baseProject]);
    });

    it("should return empty array when no projects found", async () => {
      mockRepo.findAll.mockResolvedValue([]);

      const result = await service.listProjects();

      expect(result).toEqual([]);
    });
  });

  describe("getProjectById", () => {
    it("should return project with tasks when found", async () => {
      mockRepo.findById.mockResolvedValue(baseProjectWithTasks);

      const result = await service.getProjectById("test-uuid-1");

      expect(mockRepo.findById).toHaveBeenCalledWith("test-uuid-1");
      expect(result).toEqual(baseProjectWithTasks);
    });

    it("should throw NotFoundError when project does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getProjectById("nonexistent-id")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("createProject", () => {
    it("should create project with default status Planned and progress 0", async () => {
      const input = {
        name: "New Project",
        description: "Description",
        priority: "High" as const,
        startDate: "2024-01-01",
        dueDate: "2024-06-01",
      };

      const created = { ...baseProject, name: "New Project", priority: "High" as const };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.createProject(input);

      expect(mockRepo.create).toHaveBeenCalledWith({
        name: "New Project",
        description: "Description",
        priority: "High",
        startDate: "2024-01-01",
        dueDate: "2024-06-01",
        status: "Planned",
        progress: 0,
        ownerId: null,
      });
      expect(result).toEqual(created);
    });

    it("should override any provided status to Planned", async () => {
      const input = {
        name: "New Project",
        priority: "Low" as const,
        status: "In Progress" as const,
      };

      mockRepo.create.mockResolvedValue(baseProject);

      await service.createProject(input);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "Planned",
          progress: 0,
        })
      );
    });
  });

  describe("updateProject", () => {
    it("should update project fields when no status change", async () => {
      mockRepo.findById.mockResolvedValue(baseProjectWithTasks);
      mockRepo.update.mockResolvedValue({ ...baseProject, name: "Updated" });

      const result = await service.updateProject("test-uuid-1", { name: "Updated" });

      expect(mockRepo.update).toHaveBeenCalledWith("test-uuid-1", { name: "Updated" });
      expect(result.name).toBe("Updated");
    });

    it("should throw NotFoundError when project does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateProject("nonexistent-id", { name: "Updated" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should allow valid status transition from Planned to In Progress", async () => {
      mockRepo.findById.mockResolvedValue(baseProjectWithTasks);
      mockRepo.update.mockResolvedValue({
        ...baseProject,
        status: "In Progress",
      });

      const result = await service.updateProject("test-uuid-1", {
        status: "In Progress",
      });

      expect(mockRepo.update).toHaveBeenCalledWith("test-uuid-1", {
        status: "In Progress",
      });
      expect(result.status).toBe("In Progress");
    });

    it("should throw TransitionError for invalid status transition", async () => {
      mockRepo.findById.mockResolvedValue(baseProjectWithTasks);

      await expect(
        service.updateProject("test-uuid-1", { status: "Completed" })
      ).rejects.toThrow(TransitionError);
    });

    it("should include current status, attempted status, and allowed transitions in TransitionError", async () => {
      mockRepo.findById.mockResolvedValue(baseProjectWithTasks);

      try {
        await service.updateProject("test-uuid-1", { status: "Completed" });
      } catch (error) {
        expect(error).toBeInstanceOf(TransitionError);
        const transitionError = error as TransitionError;
        expect(transitionError.currentStatus).toBe("Planned");
        expect(transitionError.attemptedStatus).toBe("Completed");
        expect(transitionError.allowedTransitions).toEqual(["In Progress", "Cancelled"]);
      }
    });

    it("should set progress to 100 when transitioning to Completed", async () => {
      const inProgressProject: ProjectWithTasks = {
        ...baseProjectWithTasks,
        status: "In Progress",
        progress: 50,
      };
      mockRepo.findById.mockResolvedValue(inProgressProject);
      mockRepo.update.mockResolvedValue({
        ...baseProject,
        status: "Completed",
        progress: 100,
      });

      await service.updateProject("test-uuid-1", { status: "Completed" });

      expect(mockRepo.update).toHaveBeenCalledWith("test-uuid-1", {
        status: "Completed",
        progress: 100,
      });
    });

    it("should not change progress for non-Completed transitions", async () => {
      mockRepo.findById.mockResolvedValue(baseProjectWithTasks);
      mockRepo.update.mockResolvedValue({
        ...baseProject,
        status: "In Progress",
      });

      await service.updateProject("test-uuid-1", { status: "In Progress" });

      expect(mockRepo.update).toHaveBeenCalledWith("test-uuid-1", {
        status: "In Progress",
      });
    });

    it("should not validate transition when status is not changing", async () => {
      mockRepo.findById.mockResolvedValue(baseProjectWithTasks);
      mockRepo.update.mockResolvedValue(baseProject);

      // Updating status to same value should not throw
      await expect(
        service.updateProject("test-uuid-1", { status: "Planned" })
      ).resolves.toBeDefined();
    });
  });

  describe("deleteProject", () => {
    it("should delete project and return its id", async () => {
      mockRepo.findById.mockResolvedValue(baseProjectWithTasks);
      mockRepo.delete.mockResolvedValue(baseProject);

      const result = await service.deleteProject("test-uuid-1");

      expect(mockRepo.findById).toHaveBeenCalledWith("test-uuid-1");
      expect(mockRepo.delete).toHaveBeenCalledWith("test-uuid-1");
      expect(result).toEqual({ id: "test-uuid-1" });
    });

    it("should throw NotFoundError when project does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.deleteProject("nonexistent-id")).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
