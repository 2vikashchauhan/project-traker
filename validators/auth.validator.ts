import { z } from "zod";

/**
 * Registration schema.
 * Validates incoming request body for POST /api/auth/register.
 *
 * - email: required, trimmed, valid email format
 * - password: required, 8-128 characters
 * - name: required, 1-100 characters after trimming
 *
 * Uses .strict() to reject unknown fields.
 */
export const registerSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Invalid email format"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters"),
  })
  .strict();

/**
 * Login schema.
 * Validates incoming request body for NextAuth.js credentials sign-in.
 *
 * - email: required, trimmed, valid email format
 * - password: required, at least 1 character
 *
 * Uses .strict() to reject unknown fields.
 */
export const loginSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict();

/**
 * Update Profile schema.
 * Validates incoming request body for PATCH /api/users/me.
 *
 * - name: required, 1-100 characters after trimming
 *
 * Uses .strict() to reject unknown fields (prevents email/role modification).
 */
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters"),
  })
  .strict();

/**
 * Change Role schema.
 * Validates incoming request body for PATCH /api/admin/users/[id].
 *
 * - role: required, must be one of Admin, Manager, Member
 *
 * Uses .strict() to reject unknown fields.
 */
export const changeRoleSchema = z
  .object({
    role: z.enum(["Admin", "Manager", "Member"]),
  })
  .strict();

// Inferred types from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
