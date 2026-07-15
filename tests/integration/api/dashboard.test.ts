import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the auth function to return a valid session
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      role: "Admin",
    },
  }),
}));

// Mock the repository modules before importing the route
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
import { GET } from "@/app/api/dashboard/route";

const mockProjectRepo = projectRepository as unknown as {
  countAll: ReturnType<typeof vi.fn>;
  countByStatus: ReturnType<typeof vi.fn>;
  getAverageProgress: ReturnType<typeof vi.fn>;
};

const mockTaskRepo = taskRepository as unknown as {
  findOverdue: ReturnType<typeof vi.fn>;
  findUpcomingDeadlines: ReturnType<typeof vi.fn>;
};

/**
 * Helper to create a minimal NextRequest for GET /api/dashboard.
 */
function createDashboardRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/dashboard", {
    method: "GET",
  });
}

describe("GET /api/dashboard - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful responses", () => {
    it("should return 200 with all dashboard statistics and correct types", async () => {
      // Requirement 1.7: GET /api/dashboard returns all stats in a single response
      mockProjectRepo.countAll.mockResolvedValue(8);
      mockProjectRepo.countByStatus.mockImplementation((status: string) => {
        if (status === "In Progress") return Promise.resolve(3);
        if (status === "Completed") return Promise.resolve(2);
        return Promise.resolve(0);
      });
      mockProjectRepo.getAverageProgress.mockResolvedValue(55.3);
      mockTaskRepo.findOverdue.mockResolvedValue(4);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([
        {
          id: "task-uuid-1",
          title: "Deploy v2",
          description: "Deploy the next version",
          status: "In Progress",
          priority: "High",
          dueDate: "2024-07-10T00:00:00.000Z",
          assignedTo: "Alice",
          projectId: "project-uuid-1",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-06-01T00:00:00.000Z",
          project: {
            id: "project-uuid-1",
            name: "Release 2.0",
            description: "Major release",
            status: "In Progress",
            priority: "High",
            startDate: null,
            dueDate: "2024-07-15T00:00:00.000Z",
            progress: 60,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-06-01T00:00:00.000Z",
          },
        },
      ]);

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalProjects).toBe(8);
      expect(body.activeProjects).toBe(3);
      expect(body.completedProjects).toBe(2);
      expect(body.overdueTasks).toBe(4);
      expect(body.averageProgress).toBe(55.3);
      expect(body.upcomingDeadlines).toHaveLength(1);
      expect(body.upcomingDeadlines[0]).toEqual({
        id: "task-uuid-1",
        title: "Deploy v2",
        dueDate: "2024-07-10T00:00:00.000Z",
        projectId: "project-uuid-1",
        projectName: "Release 2.0",
      });

      // Verify types are correct
      expect(typeof body.totalProjects).toBe("number");
      expect(typeof body.activeProjects).toBe("number");
      expect(typeof body.completedProjects).toBe("number");
      expect(typeof body.overdueTasks).toBe("number");
      expect(typeof body.averageProgress).toBe("number");
      expect(Array.isArray(body.upcomingDeadlines)).toBe(true);
    });

    it("should return zeros and empty arrays when no data exists", async () => {
      // Requirement 1.9: All counts as zero, upcoming deadlines list as empty
      mockProjectRepo.countAll.mockResolvedValue(0);
      mockProjectRepo.countByStatus.mockResolvedValue(0);
      mockProjectRepo.getAverageProgress.mockResolvedValue(0.0);
      mockTaskRepo.findOverdue.mockResolvedValue(0);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([]);

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.totalProjects).toBe(0);
      expect(body.activeProjects).toBe(0);
      expect(body.completedProjects).toBe(0);
      expect(body.overdueTasks).toBe(0);
      expect(body.averageProgress).toBe(0.0);
      expect(body.upcomingDeadlines).toEqual([]);
    });

    it("should correctly count overdue tasks (dueDate < today, status !== Done)", async () => {
      // Requirement 1.4: Overdue = dueDate < today AND status != Done
      mockProjectRepo.countAll.mockResolvedValue(2);
      mockProjectRepo.countByStatus.mockResolvedValue(1);
      mockProjectRepo.getAverageProgress.mockResolvedValue(25.0);
      mockTaskRepo.findOverdue.mockResolvedValue(5);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([]);

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.overdueTasks).toBe(5);

      // Verify findOverdue was called with a date at midnight
      expect(mockTaskRepo.findOverdue).toHaveBeenCalledTimes(1);
      const overdueCallDate = mockTaskRepo.findOverdue.mock.calls[0][0] as Date;
      expect(overdueCallDate.getHours()).toBe(0);
      expect(overdueCallDate.getMinutes()).toBe(0);
      expect(overdueCallDate.getSeconds()).toBe(0);
      expect(overdueCallDate.getMilliseconds()).toBe(0);
    });

    it("should return upcoming deadlines within 7-day window, limited to 20", async () => {
      // Requirement 1.5: Upcoming deadlines within 7 days, max 20, ordered by dueDate asc
      mockProjectRepo.countAll.mockResolvedValue(3);
      mockProjectRepo.countByStatus.mockResolvedValue(1);
      mockProjectRepo.getAverageProgress.mockResolvedValue(40.0);
      mockTaskRepo.findOverdue.mockResolvedValue(0);

      // Simulate multiple upcoming deadlines
      const upcomingTasks = Array.from({ length: 5 }, (_, i) => ({
        id: `task-${i + 1}`,
        title: `Task ${i + 1}`,
        description: null,
        status: "Todo",
        priority: "Medium",
        dueDate: `2024-07-0${i + 1}T00:00:00.000Z`,
        assignedTo: null,
        projectId: `project-${(i % 2) + 1}`,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        project: {
          id: `project-${(i % 2) + 1}`,
          name: `Project ${(i % 2) + 1}`,
          description: null,
          status: "In Progress",
          priority: "High",
          startDate: null,
          dueDate: null,
          progress: 40,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      }));
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue(upcomingTasks);

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.upcomingDeadlines).toHaveLength(5);

      // Verify the repository was called with correct params (7-day window, limit 20)
      expect(mockTaskRepo.findUpcomingDeadlines).toHaveBeenCalledTimes(1);
      const [today, endDate, limit] = mockTaskRepo.findUpcomingDeadlines.mock.calls[0];
      const diffMs = (endDate as Date).getTime() - (today as Date).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(7);
      expect(limit).toBe(20);

      // Verify each upcoming deadline has the expected shape
      for (const deadline of body.upcomingDeadlines) {
        expect(deadline).toHaveProperty("id");
        expect(deadline).toHaveProperty("title");
        expect(deadline).toHaveProperty("dueDate");
        expect(deadline).toHaveProperty("projectId");
        expect(deadline).toHaveProperty("projectName");
      }
    });

    it("should calculate average progress correctly", async () => {
      // Requirement 1.6: Average progress as percentage, 0.0% when no projects
      mockProjectRepo.countAll.mockResolvedValue(4);
      mockProjectRepo.countByStatus.mockImplementation((status: string) => {
        if (status === "In Progress") return Promise.resolve(2);
        if (status === "Completed") return Promise.resolve(1);
        return Promise.resolve(0);
      });
      mockProjectRepo.getAverageProgress.mockResolvedValue(67.5);
      mockTaskRepo.findOverdue.mockResolvedValue(1);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([]);

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.averageProgress).toBe(67.5);
    });

    it("should return averageProgress as 0.0 when no projects exist", async () => {
      // Requirement 1.6: 0.0% when no projects exist
      mockProjectRepo.countAll.mockResolvedValue(0);
      mockProjectRepo.countByStatus.mockResolvedValue(0);
      mockProjectRepo.getAverageProgress.mockResolvedValue(0.0);
      mockTaskRepo.findOverdue.mockResolvedValue(0);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([]);

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.averageProgress).toBe(0.0);
    });
  });

  describe("Error handling", () => {
    it("should return consistent JSON error format on failure", async () => {
      // Requirement 1.8: Error message when dashboard data cannot be loaded
      mockProjectRepo.countAll.mockRejectedValue(new Error("Database connection failed"));

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toHaveProperty("error");
      expect(body).toHaveProperty("message");
      expect(body.error).toBe("InternalError");
      expect(body.message).toBe("An unexpected error occurred");
      // Should not expose internal details
      expect(body.message).not.toContain("Database connection");
    });

    it("should return 500 when task repository throws an error", async () => {
      mockProjectRepo.countAll.mockResolvedValue(5);
      mockProjectRepo.countByStatus.mockResolvedValue(2);
      mockProjectRepo.getAverageProgress.mockResolvedValue(50.0);
      mockTaskRepo.findOverdue.mockRejectedValue(new Error("Task query failed"));

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("InternalError");
      expect(body.message).toBe("An unexpected error occurred");
      // Should not expose stack traces or internal details
      expect(body.message).not.toContain("Task query");
      expect(body).not.toHaveProperty("stack");
    });
  });

  describe("Response shape validation", () => {
    it("should include all required fields in the response", async () => {
      // Requirement 1.7: All dashboard statistics in a single response
      mockProjectRepo.countAll.mockResolvedValue(1);
      mockProjectRepo.countByStatus.mockResolvedValue(0);
      mockProjectRepo.getAverageProgress.mockResolvedValue(50.0);
      mockTaskRepo.findOverdue.mockResolvedValue(0);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([]);

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(200);

      // All required fields must be present
      expect(body).toHaveProperty("totalProjects");
      expect(body).toHaveProperty("activeProjects");
      expect(body).toHaveProperty("completedProjects");
      expect(body).toHaveProperty("overdueTasks");
      expect(body).toHaveProperty("upcomingDeadlines");
      expect(body).toHaveProperty("averageProgress");

      // All count fields should be non-negative integers
      expect(Number.isInteger(body.totalProjects)).toBe(true);
      expect(body.totalProjects).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(body.activeProjects)).toBe(true);
      expect(body.activeProjects).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(body.completedProjects)).toBe(true);
      expect(body.completedProjects).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(body.overdueTasks)).toBe(true);
      expect(body.overdueTasks).toBeGreaterThanOrEqual(0);
    });

    it("should include correct structure for each upcoming deadline entry", async () => {
      mockProjectRepo.countAll.mockResolvedValue(1);
      mockProjectRepo.countByStatus.mockResolvedValue(1);
      mockProjectRepo.getAverageProgress.mockResolvedValue(30.0);
      mockTaskRepo.findOverdue.mockResolvedValue(0);
      mockTaskRepo.findUpcomingDeadlines.mockResolvedValue([
        {
          id: "deadline-task-1",
          title: "Complete feature",
          description: "Finish the feature implementation",
          status: "In Progress",
          priority: "High",
          dueDate: "2024-08-01T00:00:00.000Z",
          assignedTo: "Developer",
          projectId: "project-abc",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-07-01T00:00:00.000Z",
          project: {
            id: "project-abc",
            name: "Feature Sprint",
            description: "Sprint for features",
            status: "In Progress",
            priority: "High",
            startDate: "2024-06-01T00:00:00.000Z",
            dueDate: "2024-08-15T00:00:00.000Z",
            progress: 30,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-07-01T00:00:00.000Z",
          },
        },
      ]);

      const request = createDashboardRequest();
      const response = await GET(request, { params: {} });
      const body = await response.json();

      expect(response.status).toBe(200);
      const deadline = body.upcomingDeadlines[0];
      expect(deadline.id).toBe("deadline-task-1");
      expect(deadline.title).toBe("Complete feature");
      expect(deadline.dueDate).toBe("2024-08-01T00:00:00.000Z");
      expect(deadline.projectId).toBe("project-abc");
      expect(deadline.projectName).toBe("Feature Sprint");

      // Should not include extra task fields in deadline response
      expect(deadline).not.toHaveProperty("description");
      expect(deadline).not.toHaveProperty("status");
      expect(deadline).not.toHaveProperty("priority");
      expect(deadline).not.toHaveProperty("assignedTo");
    });
  });
});
