/**
 * Shared type definitions for the Project Tracker application.
 * Uses string literal union types (compatible with Zod) instead of TypeScript enums.
 */

// Project status values
export const PROJECT_STATUSES = [
  "Planned",
  "In Progress",
  "Completed",
  "On Hold",
  "Cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// Task status values
export const TASK_STATUSES = ["Todo", "In Progress", "Review", "Done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

// Priority levels
export const PRIORITIES = ["Low", "Medium", "High"] as const;

export type Priority = (typeof PRIORITIES)[number];
