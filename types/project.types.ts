import { Priority, ProjectStatus } from "./common.types";
import { Task } from "./task.types";

/**
 * Core Project entity as stored in the database.
 */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project entity with its associated tasks included.
 */
export interface ProjectWithTasks extends Project {
  tasks: Task[];
}

/**
 * Input for creating a new project.
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string;
}

/**
 * Input for updating an existing project. All fields are optional for partial updates.
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  startDate?: string;
  dueDate?: string;
}
