import { taskRepository } from "@/repositories/task.repository";
import { projectRepository } from "@/repositories/project.repository";
import { NotFoundError, TransitionError } from "@/lib/errors";
import { isValidTaskTransition, getAllowedTaskTransitions } from "@/utils/status-transitions";
import { calculateProjectProgress } from "@/utils/progress.utils";
import { Task, CreateTaskInput, UpdateTaskInput } from "@/types/task.types";
import { ListQueryParams } from "@/types/api.types";

/**
 * TaskService encapsulates all business logic for task operations.
 * Enforces status transition rules, validates project references,
 * and triggers project progress recalculation on relevant changes.
 */
export class TaskService {
  /**
   * Lists all tasks matching the given query parameters.
   * Delegates filtering, search, and sort to the repository layer.
   */
  async listTasks(params: ListQueryParams): Promise<Task[]> {
    return taskRepository.findAll(params);
  }

  /**
   * Retrieves a single task by ID.
   * Throws NotFoundError if the task does not exist.
   */
  async getTaskById(id: string): Promise<Task> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError("Task", id);
    }
    return task;
  }

  /**
   * Creates a new task.
   * - Verifies the referenced project exists
   * - Defaults status to "Todo" if not provided
   * - Recalculates project progress after creation
   */
  async createTask(data: CreateTaskInput): Promise<Task> {
    // Verify project exists
    const project = await projectRepository.findById(data.projectId);
    if (!project) {
      throw new NotFoundError("Project", data.projectId);
    }

    // Default status to "Todo" if not provided
    const taskData: CreateTaskInput = {
      ...data,
      status: data.status ?? "Todo",
    };

    const task = await taskRepository.create(taskData);

    // Recalculate project progress after adding a new task
    await this.recalculateProjectProgress(task.projectId);

    return task;
  }

  /**
   * Updates an existing task.
   * - Throws NotFoundError if the task does not exist
   * - If projectId is being changed, verifies new project exists
   * - If status change is requested, validates the transition
   * - Throws TransitionError for invalid status transitions
   * - Recalculates project progress on any status change
   */
  async updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
    // Fetch existing task
    const existingTask = await taskRepository.findById(id);
    if (!existingTask) {
      throw new NotFoundError("Task", id);
    }

    // If projectId is being changed, verify the new project exists
    if (data.projectId !== undefined && data.projectId !== existingTask.projectId) {
      const newProject = await projectRepository.findById(data.projectId);
      if (!newProject) {
        throw new NotFoundError("Project", data.projectId);
      }
    }

    // If status change is requested, validate transition
    if (data.status !== undefined && data.status !== existingTask.status) {
      if (!isValidTaskTransition(existingTask.status, data.status)) {
        const allowedTransitions = getAllowedTaskTransitions(existingTask.status);
        throw new TransitionError(
          existingTask.status,
          data.status,
          allowedTransitions
        );
      }
    }

    const updatedTask = await taskRepository.update(id, data);

    // Recalculate project progress if status changed
    if (data.status !== undefined && data.status !== existingTask.status) {
      await this.recalculateProjectProgress(updatedTask.projectId);

      // If project changed, also recalculate progress for the old project
      if (data.projectId !== undefined && data.projectId !== existingTask.projectId) {
        await this.recalculateProjectProgress(existingTask.projectId);
      }
    }

    return updatedTask;
  }

  /**
   * Deletes a task.
   * - Throws NotFoundError if the task does not exist
   * - Recalculates project progress for the affected project after deletion
   * - Returns the deleted task's ID
   */
  async deleteTask(id: string): Promise<{ id: string }> {
    // Fetch existing task to verify it exists and get projectId
    const existingTask = await taskRepository.findById(id);
    if (!existingTask) {
      throw new NotFoundError("Task", id);
    }

    // Store projectId before deleting
    const projectId = existingTask.projectId;

    // Delete the task
    await taskRepository.delete(id);

    // Recalculate project progress for the affected project
    await this.recalculateProjectProgress(projectId);

    return { id };
  }

  /**
   * Recalculates and updates a project's progress percentage.
   * Progress = floor(doneTasks / totalTasks * 100), or 0 if no tasks.
   * Returns the new progress value.
   */
  async recalculateProjectProgress(projectId: string): Promise<number> {
    const totalTasks = await taskRepository.countByProject(projectId);
    const doneTasks = await taskRepository.countByProjectAndStatus(projectId, "Done");

    const progress = calculateProjectProgress(totalTasks, doneTasks);

    await projectRepository.update(projectId, { progress });

    return progress;
  }
}

/**
 * Singleton instance of the TaskService.
 */
export const taskService = new TaskService();
