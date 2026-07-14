import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the repository modules
vi.mock("@/repositories/project.repository", () => ({
  projectRepository: {
    countAll: vi.fn(),
    countByStatus: vi.fn(),
    getAverageProgress: vi.fn(),
  },
}));

vi.mock("@/repositories/task.repository", () => ({
  taskRepository: {
    findOverdue: vi.fn(),
    findUpcomingDeadlines: vi.fn(),
  },
}));

import { projectRepository } from "@/repositories/project.repository";
import { taskRepository } from "@/repositories/task.repository";
import { dashboardService } from "@/services/dashboard.service";

const mockProjectRepo = projectRepository as unknown as {
  countAll: ReturnType<typeof vi.fn>;
  countByStatus: ReturnType<typeof vi.fn>;
  getAverageProgress: ReturnType<typeof vi.fn>;
};

const mockTaskRepo = taskRepository as unknown as {
  findOverdue: ReturnType<typeof vi.fn>;
  findUpcomingDeadlines: ReturnType<typeof vi.fn>;
};

describe("DashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDashboardStats", () => {
    it("should aggregate all dashboard statistics correctly", async () => {
      mockProjectRepo.countAll.mockResolvedValue(10);
      mockProjectRepo.countByStatus.mockImplementation((status: string) => {
        if (status === "In Progress") return Promise.resolve(4);
        if (status === "Completed") return Promise.resolve(3);
        return Promise.resolve(0);
      });
      mockProjectRepo.getAverageProgress.mockResolvedValue(45.5);
      mockTaskRepo.findOverdue.mockResolvedValue(2);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([
        {
          id: "task-1",
          title: "Finish report",
          description: null,
          status: "Todo",
          priority: "High",
          dueDate: "2024-06-05T00:00:00.000Z",
          assignedTo: "Alice",
          projectId: "project-1",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          project: {
            id: "project-1",
            name: "Alpha Project",
            description: null,
            status: "In Progress",
            priority: "High",
            startDate: null,
            dueDate: null,
            progress: 50,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        },
      ]);

      const result = await dashboardService.getDashboardStats();

      expect(result.totalProjects).toBe(10);
      expect(result.activeProjects).toBe(4);
      expect(result.completedProjects).toBe(3);
      expect(result.overdueTasks).toBe(2);
      expect(result.averageProgress).toBe(45.5);
      expect(result.upcomingDeadlines).toHaveLength(1);
      expect(result.upcomingDeadlines[0]).toEqual({
        id: "task-1",
        title: "Finish report",
        dueDate: "2024-06-05T00:00:00.000Z",
        projectId: "project-1",
        projectName: "Alpha Project",
      });
    });

    it("should return empty results when no projects or tasks exist", async () => {
      mockProjectRepo.countAll.mockResolvedValue(0);
      mockProjectRepo.countByStatus.mockResolvedValue(0);
      mockProjectRepo.getAverageProgress.mockResolvedValue(0.0);
      mockTaskRepo.findOverdue.mockResolvedValue(0);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([]);

      const result = await dashboardService.getDashboardStats();

      expect(result.totalProjects).toBe(0);
      expect(result.activeProjects).toBe(0);
      expect(result.completedProjects).toBe(0);
      expect(result.overdueTasks).toBe(0);
      expect(result.averageProgress).toBe(0.0);
      expect(result.upcomingDeadlines).toEqual([]);
    });

    it("should call findOverdue with today at midnight", async () => {
      mockProjectRepo.countAll.mockResolvedValue(0);
      mockProjectRepo.countByStatus.mockResolvedValue(0);
      mockProjectRepo.getAverageProgress.mockResolvedValue(0);
      mockTaskRepo.findOverdue.mockResolvedValue(0);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([]);

      await dashboardService.getDashboardStats();

      const callArgs = mockTaskRepo.findOverdue.mock.calls[0];
      const todayArg: Date = callArgs[0];
      expect(todayArg.getHours()).toBe(0);
      expect(todayArg.getMinutes()).toBe(0);
      expect(todayArg.getSeconds()).toBe(0);
      expect(todayArg.getMilliseconds()).toBe(0);
    });

    it("should call findUpcomingDeadlines with 7-day window and limit of 20", async () => {
      mockProjectRepo.countAll.mockResolvedValue(0);
      mockProjectRepo.countByStatus.mockResolvedValue(0);
      mockProjectRepo.getAverageProgress.mockResolvedValue(0);
      mockTaskRepo.findOverdue.mockResolvedValue(0);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([]);

      await dashboardService.getDashboardStats();

      const callArgs = mockTaskRepo.findUpcomingDeadlines.mock.calls[0];
      const today: Date = callArgs[0];
      const endDate: Date = callArgs[1];
      const limit: number = callArgs[2];

      // endDate should be 7 days from today
      const diffMs = endDate.getTime() - today.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(7);
      expect(limit).toBe(20);
    });

    it("should call countByStatus with correct status values", async () => {
      mockProjectRepo.countAll.mockResolvedValue(0);
      mockProjectRepo.countByStatus.mockResolvedValue(0);
      mockProjectRepo.getAverageProgress.mockResolvedValue(0);
      mockTaskRepo.findOverdue.mockResolvedValue(0);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([]);

      await dashboardService.getDashboardStats();

      expect(mockProjectRepo.countByStatus).toHaveBeenCalledWith("In Progress");
      expect(mockProjectRepo.countByStatus).toHaveBeenCalledWith("Completed");
    });

    it("should map multiple upcoming tasks correctly", async () => {
      mockProjectRepo.countAll.mockResolvedValue(5);
      mockProjectRepo.countByStatus.mockResolvedValue(2);
      mockProjectRepo.getAverageProgress.mockResolvedValue(60.0);
      mockTaskRepo.findOverdue.mockResolvedValue(1);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([
        {
          id: "task-1",
          title: "Task One",
          description: null,
          status: "Todo",
          priority: "High",
          dueDate: "2024-06-01T00:00:00.000Z",
          assignedTo: null,
          projectId: "project-1",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          project: {
            id: "project-1",
            name: "Project A",
            description: null,
            status: "In Progress",
            priority: "High",
            startDate: null,
            dueDate: null,
            progress: 50,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        },
        {
          id: "task-2",
          title: "Task Two",
          description: "A task",
          status: "In Progress",
          priority: "Medium",
          dueDate: "2024-06-03T00:00:00.000Z",
          assignedTo: "Bob",
          projectId: "project-2",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          project: {
            id: "project-2",
            name: "Project B",
            description: "Desc",
            status: "Planned",
            priority: "Medium",
            startDate: null,
            dueDate: null,
            progress: 0,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        },
      ]);

      const result = await dashboardService.getDashboardStats();

      expect(result.upcomingDeadlines).toHaveLength(2);
      expect(result.upcomingDeadlines[0]).toEqual({
        id: "task-1",
        title: "Task One",
        dueDate: "2024-06-01T00:00:00.000Z",
        projectId: "project-1",
        projectName: "Project A",
      });
      expect(result.upcomingDeadlines[1]).toEqual({
        id: "task-2",
        title: "Task Two",
        dueDate: "2024-06-03T00:00:00.000Z",
        projectId: "project-2",
        projectName: "Project B",
      });
    });
  });
});
