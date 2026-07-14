import { z } from "zod";
import { TASK_STATUSES, PRIORITIES } from "@/types/common.types";
import { uuidSchema } from "@/validators/common.validator";

/**
 * Schema for creating a new task.
 * Uses strict mode to reject unknown fields (Requirement 19.4).
 */
export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required and must contain at least one non-whitespace character")
      .max(150, "Title must not exceed 150 characters"),
    description: z
      .string()
      .max(1000, "Description must not exceed 1000 characters")
      .optional(),
    priority: z.enum(PRIORITIES, {
      errorMap: () => ({
        message: `Priority is required and must be one of: ${PRIORITIES.join(", ")}`,
      }),
    }),
    projectId: uuidSchema,
    status: z
      .enum(TASK_STATUSES, {
        errorMap: () => ({
          message: `Status must be one of: ${TASK_STATUSES.join(", ")}`,
        }),
      })
      .default("Todo"),
    dueDate: z
      .string()
      .datetime({ message: "Due date must be a valid ISO 8601 date string" })
      .optional(),
    assignedTo: z
      .string()
      .min(1, "Assigned to must be at least 1 character")
      .max(100, "Assigned to must not exceed 100 characters")
      .nullable()
      .optional(),
  })
  .strict();

/**
 * Schema for updating an existing task.
 * All fields are optional for partial updates, same validation constraints.
 * Uses strict mode to reject unknown fields (Requirement 19.4).
 */
export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title must contain at least one non-whitespace character")
      .max(150, "Title must not exceed 150 characters")
      .optional(),
    description: z
      .string()
      .max(1000, "Description must not exceed 1000 characters")
      .optional(),
    priority: z
      .enum(PRIORITIES, {
        errorMap: () => ({
          message: `Priority must be one of: ${PRIORITIES.join(", ")}`,
        }),
      })
      .optional(),
    projectId: uuidSchema.optional(),
    status: z
      .enum(TASK_STATUSES, {
        errorMap: () => ({
          message: `Status must be one of: ${TASK_STATUSES.join(", ")}`,
        }),
      })
      .optional(),
    dueDate: z
      .string()
      .datetime({ message: "Due date must be a valid ISO 8601 date string" })
      .optional(),
    assignedTo: z
      .string()
      .min(1, "Assigned to must be at least 1 character")
      .max(100, "Assigned to must not exceed 100 characters")
      .nullable()
      .optional(),
  })
  .strict();

// Inferred types from schemas
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
