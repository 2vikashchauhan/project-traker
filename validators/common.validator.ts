import { z } from "zod";
import {
  PROJECT_STATUSES,
  TASK_STATUSES,
  PRIORITIES,
  type ProjectStatus,
  type TaskStatus,
  type Priority,
} from "@/types/common.types";

/**
 * UUID validator schema.
 * Validates that a string is in valid UUID format.
 */
export const uuidSchema = z.string().uuid();

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
 * Base list query params schema.
 * Validates common query parameters for list endpoints:
 * - search: optional string, max 200 chars, trimmed
 * - sortBy: optional, currently only "dueDate"
 * - sortOrder: optional "asc" | "desc", defaults to "asc"
 *
 * Uses .passthrough() to allow extra params from URL query strings.
 */
export const listQueryParamsSchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(200, "Search term exceeds the maximum allowed length of 200 characters")
      .optional(),
    sortBy: z
      .string()
      .refine((val) => val === "dueDate", {
        message: "Invalid sortBy value. Allowed values: dueDate",
      })
      .optional(),
    sortOrder: z
      .enum(["asc", "desc"], {
        errorMap: () => ({
          message: "Invalid sortOrder value. Allowed values: asc, desc",
        }),
      })
      .default("asc")
      .optional(),
  })
  .passthrough();

/**
 * Project query params schema.
 * Extends listQueryParamsSchema with:
 * - status: case-insensitive validation against PROJECT_STATUSES
 * - priority: case-insensitive validation against PRIORITIES
 */
export const projectQueryParamsSchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(200, "Search term exceeds the maximum allowed length of 200 characters")
      .optional(),
    sortBy: z
      .string()
      .refine((val) => val === "dueDate", {
        message: "Invalid sortBy value. Allowed values: dueDate",
      })
      .optional(),
    sortOrder: z
      .enum(["asc", "desc"], {
        errorMap: () => ({
          message: "Invalid sortOrder value. Allowed values: asc, desc",
        }),
      })
      .default("asc")
      .optional(),
    status: caseInsensitiveEnum(PROJECT_STATUSES, "status").optional(),
    priority: caseInsensitiveEnum(PRIORITIES, "priority").optional(),
  })
  .passthrough();

/**
 * Task query params schema.
 * Extends listQueryParamsSchema with:
 * - status: case-insensitive validation against TASK_STATUSES
 * - priority: case-insensitive validation against PRIORITIES
 */
export const taskQueryParamsSchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(200, "Search term exceeds the maximum allowed length of 200 characters")
      .optional(),
    sortBy: z
      .string()
      .refine((val) => val === "dueDate", {
        message: "Invalid sortBy value. Allowed values: dueDate",
      })
      .optional(),
    sortOrder: z
      .enum(["asc", "desc"], {
        errorMap: () => ({
          message: "Invalid sortOrder value. Allowed values: asc, desc",
        }),
      })
      .default("asc")
      .optional(),
    status: caseInsensitiveEnum(TASK_STATUSES, "status").optional(),
    priority: caseInsensitiveEnum(PRIORITIES, "priority").optional(),
  })
  .passthrough();

// Type inferences
export type UuidInput = z.infer<typeof uuidSchema>;
export type ListQueryParams = z.infer<typeof listQueryParamsSchema>;
export type ProjectQueryParams = z.infer<typeof projectQueryParamsSchema>;
export type TaskQueryParams = z.infer<typeof taskQueryParamsSchema>;
