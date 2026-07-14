import type { ProjectStatus, TaskStatus } from "@/types/common.types";

/**
 * Allowed project status transitions.
 * Each key maps to an array of valid next statuses.
 */
export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  "Planned": ["In Progress", "Cancelled"],
  "In Progress": ["Completed", "On Hold", "Cancelled"],
  "Completed": [],
  "On Hold": ["In Progress", "Cancelled"],
  "Cancelled": [],
};

/**
 * Allowed task status transitions.
 * Each key maps to an array of valid next statuses.
 */
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  "Todo": ["In Progress"],
  "In Progress": ["Review"],
  "Review": ["Done", "In Progress"],
  "Done": [],
};

/**
 * Checks if a project status transition is valid.
 */
export function isValidProjectTransition(
  current: ProjectStatus,
  next: ProjectStatus
): boolean {
  return PROJECT_STATUS_TRANSITIONS[current].includes(next);
}

/**
 * Checks if a task status transition is valid.
 */
export function isValidTaskTransition(
  current: TaskStatus,
  next: TaskStatus
): boolean {
  return TASK_STATUS_TRANSITIONS[current].includes(next);
}

/**
 * Returns all allowed transitions from a given project status.
 */
export function getAllowedProjectTransitions(
  current: ProjectStatus
): ProjectStatus[] {
  return PROJECT_STATUS_TRANSITIONS[current];
}

/**
 * Returns all allowed transitions from a given task status.
 */
export function getAllowedTaskTransitions(current: TaskStatus): TaskStatus[] {
  return TASK_STATUS_TRANSITIONS[current];
}
