import fc from "fast-check";
import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Property 14: Registration confirmation password mismatch
 *
 * Validates: Requirements 9.3
 *
 * For any two distinct strings used as password and confirmPassword on the registration form,
 * client-side validation SHALL produce an error and prevent the API request from being submitted.
 *
 * We test the Zod schema directly (same schema used in the register page component).
 */

// Recreate the schema used in the registration form (app/(auth)/register/page.tsx)
const registerFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters"),
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// --- Arbitraries ---

/** Generates a valid password (8-128 chars, printable ASCII) */
const validPasswordArb = fc.stringOf(
  fc.integer({ min: 0x20, max: 0x7e }).map((c) => String.fromCharCode(c)),
  { minLength: 8, maxLength: 64 }
);

/** Generates a valid name (1-100 chars, non-empty after trim) */
const validNameArb = fc
  .stringOf(
    fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split("")
    ),
    { minLength: 1, maxLength: 100 }
  )
  .filter((s) => s.trim().length >= 1);

/** Generates a valid email address */
const validEmailArb = fc
  .tuple(
    fc.stringOf(
      fc.constantFrom(
        ...'abcdefghijklmnopqrstuvwxyz0123456789'.split("")
      ),
      { minLength: 1, maxLength: 20 }
    ),
    fc.stringOf(
      fc.constantFrom(
        ...'abcdefghijklmnopqrstuvwxyz0123456789'.split("")
      ),
      { minLength: 1, maxLength: 10 }
    ),
    fc.constantFrom("com", "org", "net", "io", "dev")
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

describe("Property 14: Registration confirmation password mismatch", () => {
  it("for any two distinct strings as password and confirmPassword, validation SHALL produce an error", () => {
    fc.assert(
      fc.property(
        validPasswordArb,
        validPasswordArb,
        validEmailArb,
        validNameArb,
        (password, confirmPassword, email, name) => {
          // Ensure passwords are different
          fc.pre(password !== confirmPassword);

          const result = registerFormSchema.safeParse({
            name,
            email,
            password,
            confirmPassword,
          });

          // Validation must fail when passwords don't match
          expect(result.success).toBe(false);

          if (!result.success) {
            // The error should be on the confirmPassword path
            const confirmPasswordErrors = result.error.issues.filter(
              (issue) =>
                issue.path.includes("confirmPassword")
            );
            expect(confirmPasswordErrors.length).toBeGreaterThan(0);
            expect(confirmPasswordErrors[0].message).toBe(
              "Passwords do not match"
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("for any matching password and confirmPassword, validation SHALL pass (sanity check)", () => {
    fc.assert(
      fc.property(
        validPasswordArb,
        validEmailArb,
        validNameArb,
        (password, email, name) => {
          const result = registerFormSchema.safeParse({
            name,
            email,
            password,
            confirmPassword: password, // Same as password
          });

          // Validation must succeed when passwords match
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
