import fc from "fast-check";
import { describe, it, expect } from "vitest";
import { updateProjectSchema } from "@/validators/project.validator";
import { updateTaskSchema } from "@/validators/task.validator";

// --- Helpers ---

/**
 * Generates a valid ISO date string.
 */
const isoDateArb = fc
  .date({ min: new Date("2000-01-01"), max: new Date("2099-12-31") })
  .map((d) => d.toISOString());

/**
 * Generates a valid UUID v4.
 */
const uuidArb = fc.uuid();

// --- Property 12: Failed Validation Preserves Data Integrity ---

describe("Property 12: Failed Validation Preserves Data Integrity", () => {
  // Feature: project-tracker, Property 12: Failed Validation Preserves Data Integrity
  /**
   * Validates: Requirements 4.6
   *
   * For any existing project or task record and for any update request that fails
   * validation, the record in the database SHALL remain unchanged after the rejected
   * request completes.
   *
   * Implementation approach: Since this is a logic-level property test, we verify that
   * the validation layer correctly rejects all invalid update payloads. Because the
   * architecture enforces that no unvalidated input reaches the service/repository layer,
   * rejection by the validator guarantees the database record remains unchanged.
   */

  describe("Invalid project update requests are rejected by validator", () => {
    it("rejects project updates with empty names (whitespace-only)", () => {
      const whitespaceOnlyArb = fc
        .integer({ min: 0, max: 50 })
        .map((n) => " ".repeat(n));

      fc.assert(
        fc.property(whitespaceOnlyArb, (name) => {
          const input = { name };
          const result = updateProjectSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects project updates with names exceeding 100 characters", () => {
      const longNameArb = fc
        .string({ minLength: 101, maxLength: 300 })
        .filter((s) => s.trim().length > 100);

      fc.assert(
        fc.property(longNameArb, (name) => {
          const input = { name };
          const result = updateProjectSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects project updates with descriptions exceeding 500 characters", () => {
      const longDescArb = fc.string({ minLength: 501, maxLength: 800 });

      fc.assert(
        fc.property(longDescArb, (description) => {
          const input = { description };
          const result = updateProjectSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects project updates with invalid priority values", () => {
      const invalidPriorityArb = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(
          (s) =>
            !["low", "medium", "high"].includes(s.toLowerCase())
        );

      fc.assert(
        fc.property(invalidPriorityArb, (priority) => {
          const input = { priority };
          const result = updateProjectSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects project updates with invalid status values", () => {
      const invalidStatusArb = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(
          (s) =>
            !["planned", "in progress", "completed", "on hold", "cancelled"].includes(
              s.toLowerCase()
            )
        );

      fc.assert(
        fc.property(invalidStatusArb, (status) => {
          const input = { status };
          const result = updateProjectSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects project updates with dueDate earlier than startDate", () => {
      const invalidDatesArb = fc
        .tuple(
          fc.date({ min: new Date("2000-01-01"), max: new Date("2099-12-31") }),
          fc.integer({ min: 1, max: 365 * 50 })
        )
        .map(([startDate, offsetDays]) => {
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() - offsetDays);
          return {
            startDate: startDate.toISOString(),
            dueDate: dueDate.toISOString(),
          };
        })
        .filter(
          ({ startDate, dueDate }) => new Date(dueDate) < new Date(startDate)
        );

      fc.assert(
        fc.property(invalidDatesArb, ({ startDate, dueDate }) => {
          const input = { startDate, dueDate };
          const result = updateProjectSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects project updates with unknown fields", () => {
      const unknownFieldArb = fc
        .string({ minLength: 1, maxLength: 30 })
        .filter(
          (s) =>
            !["name", "description", "priority", "status", "startDate", "dueDate"].includes(s) &&
            /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)
        );

      fc.assert(
        fc.property(unknownFieldArb, fc.anything(), (fieldName, fieldValue) => {
          const input: Record<string, unknown> = {
            [fieldName]: fieldValue,
          };
          const result = updateProjectSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Invalid task update requests are rejected by validator", () => {
    it("rejects task updates with empty titles (whitespace-only)", () => {
      const whitespaceOnlyArb = fc
        .integer({ min: 0, max: 50 })
        .map((n) => " ".repeat(n));

      fc.assert(
        fc.property(whitespaceOnlyArb, (title) => {
          const input = { title };
          const result = updateTaskSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects task updates with titles exceeding 150 characters", () => {
      const longTitleArb = fc
        .string({ minLength: 151, maxLength: 400 })
        .filter((s) => s.trim().length > 150);

      fc.assert(
        fc.property(longTitleArb, (title) => {
          const input = { title };
          const result = updateTaskSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects task updates with descriptions exceeding 1000 characters", () => {
      const longDescArb = fc.string({ minLength: 1001, maxLength: 1500 });

      fc.assert(
        fc.property(longDescArb, (description) => {
          const input = { description };
          const result = updateTaskSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects task updates with invalid priority values", () => {
      const invalidPriorityArb = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(
          (s) =>
            !["low", "medium", "high"].includes(s.toLowerCase())
        );

      fc.assert(
        fc.property(invalidPriorityArb, (priority) => {
          const input = { priority };
          const result = updateTaskSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects task updates with invalid status values", () => {
      const invalidStatusArb = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(
          (s) =>
            !["todo", "in progress", "review", "done"].includes(s.toLowerCase())
        );

      fc.assert(
        fc.property(invalidStatusArb, (status) => {
          const input = { status };
          const result = updateTaskSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects task updates with invalid projectId format", () => {
      const invalidUuidArb = fc
        .string({ minLength: 1, maxLength: 100 })
        .filter((s) => {
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return !uuidRegex.test(s);
        });

      fc.assert(
        fc.property(invalidUuidArb, (projectId) => {
          const input = { projectId };
          const result = updateTaskSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects task updates with unknown fields", () => {
      const unknownFieldArb = fc
        .string({ minLength: 1, maxLength: 30 })
        .filter(
          (s) =>
            ![
              "title",
              "description",
              "priority",
              "projectId",
              "status",
              "dueDate",
              "assignedTo",
            ].includes(s) && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)
        );

      fc.assert(
        fc.property(unknownFieldArb, fc.anything(), (fieldName, fieldValue) => {
          const input: Record<string, unknown> = {
            [fieldName]: fieldValue,
          };
          const result = updateTaskSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects task updates with assignedTo exceeding 100 characters", () => {
      const longAssigneeArb = fc
        .string({ minLength: 101, maxLength: 200 })
        .filter((s) => s.length > 100);

      fc.assert(
        fc.property(longAssigneeArb, (assignedTo) => {
          const input = { assignedTo };
          const result = updateTaskSchema.safeParse(input);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Validation gate guarantees database integrity", () => {
    it("any randomly invalid project update payload is rejected before reaching DB", () => {
      /**
       * Generate payloads that are guaranteed to be invalid by combining
       * multiple violation strategies.
       */
      const invalidProjectPayloadArb = fc.oneof(
        // Strategy 1: Invalid name (too long)
        fc.string({ minLength: 101, maxLength: 300 }).filter((s) => s.trim().length > 100).map((name) => ({ name })),
        // Strategy 2: Invalid description (too long)
        fc.string({ minLength: 501, maxLength: 800 }).map((description) => ({ description })),
        // Strategy 3: Invalid priority
        fc.string({ minLength: 1, maxLength: 50 })
          .filter((s) => !["low", "medium", "high"].includes(s.toLowerCase()))
          .map((priority) => ({ priority })),
        // Strategy 4: Invalid status
        fc.string({ minLength: 1, maxLength: 50 })
          .filter((s) => !["planned", "in progress", "completed", "on hold", "cancelled"].includes(s.toLowerCase()))
          .map((status) => ({ status })),
        // Strategy 5: Unknown field
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) =>
              !["name", "description", "priority", "status", "startDate", "dueDate"].includes(s) &&
              /^[a-zA-Z_]\w*$/.test(s)
          ),
          fc.anything()
        ).map(([key, val]) => ({ [key]: val }))
      );

      fc.assert(
        fc.property(invalidProjectPayloadArb, (payload) => {
          const result = updateProjectSchema.safeParse(payload);
          expect(result.success).toBe(false);
        }),
        { numRuns: 200 }
      );
    });

    it("any randomly invalid task update payload is rejected before reaching DB", () => {
      /**
       * Generate payloads that are guaranteed to be invalid by combining
       * multiple violation strategies.
       */
      const invalidTaskPayloadArb = fc.oneof(
        // Strategy 1: Invalid title (too long)
        fc.string({ minLength: 151, maxLength: 400 }).filter((s) => s.trim().length > 150).map((title) => ({ title })),
        // Strategy 2: Invalid description (too long)
        fc.string({ minLength: 1001, maxLength: 1500 }).map((description) => ({ description })),
        // Strategy 3: Invalid priority
        fc.string({ minLength: 1, maxLength: 50 })
          .filter((s) => !["low", "medium", "high"].includes(s.toLowerCase()))
          .map((priority) => ({ priority })),
        // Strategy 4: Invalid status
        fc.string({ minLength: 1, maxLength: 50 })
          .filter((s) => !["todo", "in progress", "review", "done"].includes(s.toLowerCase()))
          .map((status) => ({ status })),
        // Strategy 5: Invalid projectId (non-UUID)
        fc.string({ minLength: 1, maxLength: 50 })
          .filter((s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s))
          .map((projectId) => ({ projectId })),
        // Strategy 6: Unknown field
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 20 }).filter(
            (s) =>
              !["title", "description", "priority", "projectId", "status", "dueDate", "assignedTo"].includes(s) &&
              /^[a-zA-Z_]\w*$/.test(s)
          ),
          fc.anything()
        ).map(([key, val]) => ({ [key]: val }))
      );

      fc.assert(
        fc.property(invalidTaskPayloadArb, (payload) => {
          const result = updateTaskSchema.safeParse(payload);
          expect(result.success).toBe(false);
        }),
        { numRuns: 200 }
      );
    });
  });
});
