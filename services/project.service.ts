import { projectRepository, ProjectRepository } from "@/repositories/project.repository";
import { NotFoundError, TransitionError } from "@/lib/errors";
import {
  isValidProjectTransition,
  getAllowedProjectTransitions,
} from "@/utils/status-transitions";
import { Project, ProjectWithTasks, CreateProjectInput, UpdateProjectInput } from "@/types/project.types";
import { ListQueryParams } from "@/types/api.types";

/**
 * Service layer for project business logic.
 * Enforces status transition rules, default values on create,
 * and progress updates on status changes.
 */
export class ProjectService {
  constructor(private repository: ProjectRepository = projectRepository) {}

  /**
   * List all projects with optional search, filter, and sort params.
   * Delegates directly to the repository.
   */
  async listProjects(params: ListQueryParams = {}): Promise<Project[]> {
    return this.repository.findAll(params);
  }

  /**
   * Retrieve a single project by ID, including associated tasks.
   * Throws NotFoundError if the project does not exist.
   */
  async getProjectById(id: string): Promise<ProjectWithTasks> {
    const project = await this.repository.findById(id);
    if (!project) {
      throw new NotFoundError("Project", id);
    }
    return project;
  }

  /**
   * Create a new project with default status "Planned" and progress 0.
   * Any provided status or progress values in the input are overridden.
   */
  async createProject(data: CreateProjectInput): Promise<Project> {
    return this.repository.create({
      name: data.name,
      description: data.description,
      priority: data.priority,
      startDate: data.startDate,
      dueDate: data.dueDate,
      status: "Planned",
      progress: 0,
    });
  }

  /**
   * Update an existing project.
   * - Throws NotFoundError if the project does not exist.
   * - If status change is requested, validates the transition.
   * - If transitioning to "Completed", forces progress to 100.
   * - Throws TransitionError for invalid status transitions.
   */
  async updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Project", id);
    }

    // If a status change is requested, validate the transition
    if (data.status && data.status !== existing.status) {
      const valid = isValidProjectTransition(existing.status, data.status);
      if (!valid) {
        const allowed = getAllowedProjectTransitions(existing.status);
        throw new TransitionError(existing.status, data.status, allowed);
      }
    }

    // Build the update payload
    const updateData: {
      name?: string;
      description?: string;
      status?: typeof data.status;
      priority?: typeof data.priority;
      startDate?: string;
      dueDate?: string;
      progress?: number;
    } = { ...data };

    // If transitioning to "Completed", force progress to 100
    if (data.status === "Completed") {
      updateData.progress = 100;
    }

    return this.repository.update(id, updateData);
  }

  /**
   * Delete a project by ID.
   * Throws NotFoundError if the project does not exist.
   * Returns the deleted project's ID.
   */
  async deleteProject(id: string): Promise<{ id: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Project", id);
    }

    await this.repository.delete(id);
    return { id };
  }
}

/**
 * Singleton instance of ProjectService for use across the application.
 */
export const projectService = new ProjectService();
