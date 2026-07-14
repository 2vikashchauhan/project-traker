import { projectRepository } from "@/repositories/project.repository";
import { taskRepository } from "@/repositories/task.repository";
import { DashboardResponse, UpcomingDeadline } from "@/types/api.types";

/**
 * DashboardService aggregates project and task statistics
 * for the dashboard overview.
 */
class DashboardService {
  /**
   * Retrieves all dashboard statistics in a single call.
   * Aggregates: totalProjects, activeProjects, completedProjects,
   * overdueTasks, upcomingDeadlines (next 7 days, max 20), averageProgress.
   */
  async getDashboardStats(): Promise<DashboardResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      overdueTasks,
      upcomingTasks,
      averageProgress,
    ] = await Promise.all([
      projectRepository.countAll(),
      projectRepository.countByStatus("In Progress"),
      projectRepository.countByStatus("Completed"),
      taskRepository.findOverdue(today),
      taskRepository.findUpcomingDeadlines(today, endDate, 20),
      projectRepository.getAverageProgress(),
    ]);

    const upcomingDeadlines: UpcomingDeadline[] = upcomingTasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate!,
      projectId: task.projectId,
      projectName: task.project.name,
    }));

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueTasks,
      upcomingDeadlines,
      averageProgress,
    };
  }
}

/**
 * Singleton instance of DashboardService.
 */
export const dashboardService = new DashboardService();
