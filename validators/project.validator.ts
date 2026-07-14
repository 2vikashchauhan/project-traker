import { z } from "zod";
import {
  PROJECT_STATUSES,
  PRIORITIES,
  type ProjectStatus,
  type Priority,
} from "@/types/common.types";

/**
 * Helper to perform case-insensitive enum matching.
 * Transforms the input to the canonical casing from the allowed values array.
 */
function caseInsensitiveEnum<T extends string>(
  allowedValues: readonly T[],
  fieldName: string
) {
  return z.string().transform((val, ctx) => {
    const match = allowedValues.find(
      (v) => v.toLowerCase() === val.toLowerCase()
    );
    if (!match) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid ${fieldName}. Allowed values: ${allowedValues.join(", ")}`,
      });
      return z.NEVER;
    }
    return match as T;
  });
}

/**
 * ISO 8601 date string validator.
 * Validates that the string can be parsed as a valid date.
 */
const isoDateString = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: "Invalid date format. Must be a valid ISO 8601 date string" }
);

/**
 * Create Project schema.
 * Validates incoming request body for POST /api/projects.
 *
 * - name: required, 1-100 chars after trimming
 * - description: optional, max 500 chars, trimmed
 * - priority: required, case-insensitive enum (Low, Medium, High)
 * - status: optional, defaults to "Planned", case-insensitive enum
 * - startDate: optional, valid ISO date string
 * - dueDate: optional, valid ISO date string, must be >= startDate if both provided
 *
 * Uses .strict() to reject unknown fields.
 */
export const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(1, "Name is required and must not be empty")
      .max(100, "Name must not exceed 100 characters"),
    description: z
      .string()
      .trim()
      .max(500, "Description must not exceed 500 characters")
      .optional(),
    priority: caseInsensitiveEnum(PRIORITIES, "priority"),
    status: caseInsensitiveEnum(PROJECT_STATUSES, "status")
      .default("Planned"),
    startDate: isoDateString.optional(),
    dueDate: isoDateString.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return new Date(data.dueDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "Due date must be greater than or equal to start date",
      path: ["dueDate"],
    }
  );

/**
 * Update Project schema.
 * Validates incoming request body for PUT /api/projects/:id.
 * All fields are optional for partial updates, same validation constraints apply.
 *
 * Uses .strict() to reject unknown fields.
 */
export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name must not be empty")
      .max(100, "Name must not exceed 100 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, "Description must not exceed 500 characters")
      .optional(),
    priority: caseInsensitiveEnum(PRIORITIES, "priority").optional(),
    status: caseInsensitiveEnum(PROJECT_STATUSES, "status").optional(),
    startDate: isoDateString.optional(),
    dueDate: isoDateString.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return new Date(data.dueDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "Due date must be greater than or equal to start date",
      path: ["dueDate"],
    }
  );

// Inferred types from schemas
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
