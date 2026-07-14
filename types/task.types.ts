import { Priority, TaskStatus } from "./common.types";
import { Project } from "./project.types";

/**
 * Core Task entity as stored in the database.
 */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  assignedTo: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Task entity with its parent project included.
 */
export interface TaskWithProject extends Task {
  project: Project;
}

/**
 * Input for creating a new task.
 */
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority: Priority;
  dueDate?: string;
  assignedTo?: string | null;
  projectId: string;
}

/**
 * Input for updating an existing task. All fields are optional for partial updates.
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  assignedTo?: string | null;
  projectId?: string;
}
