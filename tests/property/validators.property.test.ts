import fc from "fast-check";
import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/validators/project.validator";
import {
  createTaskSchema,
  updateTaskSchema,
} from "@/validators/task.validator";

// --- Helpers ---

/**
 * Generates a valid ISO date string (YYYY-MM-DD or full ISO 8601).
 */
const isoDateArb = fc
  .date({ min: new Date("2000-01-01"), max: new Date("2099-12-31") })
  .map((d) => d.toISOString());

/**
 * Generates a valid UUID v4 string.
 */
const uuidArb = fc.uuid();

/**
 * Generates a non-empty trimmed string within a length range.
 */
function nonEmptyTrimmedString(minLength: number, maxLength: number) {
  return fc
    .string({ minLength, maxLength })
    .map((s) => s.trim())
    .filter((s) => s.length >= minLength && s.length <= maxLength);
}

// --- Property 1: Zod Schema Round-Trip Preservation ---

describe("Property 1: Zod Schema Round-Trip Preservation", () => {
  // Feature: project-tracker, Property 1: Zod Schema Round-Trip Preservation
  /**
   * Validates: Requirements 19.5, 19.3
   *
   * For any valid project or task data object, parsing it through the Zod schema
   * and then serializing the result SHALL produce a deeply equal object after
   * accounting for schema-defined transforms (whitespace trimming).
   */

  it("createProjectSchema: parse(result) === result for any valid input", () => {
    const validProjectArb = fc.record({
      name: nonEmptyTrimmedString(1, 100),
      description: fc.oneof(
        fc.constant(undefined),
        fc.string({ maxLength: 500 })
      ),
      priority: fc.constantFrom("Low", "Medium", "High"),
      status: fc.constantFrom(
        "Planned",
        "In Progress",
        "Completed",
        "On Hold",
        "Cancelled"
      ),
      startDate: fc.constant(undefined),
      dueDate: fc.constant(undefined),
    });

    fc.assert(
      fc.property(validProjectArb, (input) => {
        const cleaned: Record<string, unknown> = { ...input };
        if (cleaned.description === undefined) delete cleaned.description;

        const result = createProjectSchema.safeParse(cleaned);
        if (result.success) {
          const reparsed = createProjectSchema.safeParse(result.data);
          expect(reparsed.success).toBe(true);
          if (reparsed.success) {
            expect(reparsed.data).toEqual(result.data);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("createProjectSchema with dates: round-trip preserves parsed data", () => {
    const validProjectWithDatesArb = fc
      .tuple(isoDateArb, isoDateArb)
      .map(([d1, d2]) => {
        const sorted = [d1, d2].sort();
        return { startDate: sorted[0], dueDate: sorted[1] };
      })
      .chain((dates) =>
        fc.record({
          name: nonEmptyTrimmedString(1, 100),
          priority: fc.constantFrom("Low", "Medium", "High"),
          startDate: fc.constant(dates.startDate),
          dueDate: fc.constant(dates.dueDate),
        })
      );

    fc.assert(
      fc.property(validProjectWithDatesArb, (input) => {
        const result = createProjectSchema.safeParse(input);
        if (result.success) {
          const reparsed = createProjectSchema.safeParse(result.data);
          expect(reparsed.success).toBe(true);
          if (reparsed.success) {
            expect(reparsed.data).toEqual(result.data);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("createTaskSchema: parse(result) === result for any valid input", () => {
    const validTaskArb = fc.record({
      title: nonEmptyTrimmedString(1, 150),
      description: fc.oneof(
        fc.constant(undefined),
        fc.string({ maxLength: 1000 })
      ),
      priority: fc.constantFrom("Low", "Medium", "High"),
      projectId: uuidArb,
      status: fc.constantFrom("Todo", "In Progress", "Review", "Done"),
      dueDate: fc.oneof(fc.constant(undefined), isoDateArb),
      assignedTo: fc.oneof(
        fc.constant(undefined),
        fc.constant(null),
        nonEmptyTrimmedString(1, 100)
      ),
    });

    fc.assert(
      fc.property(validTaskArb, (input) => {
        const cleaned: Record<string, unknown> = { ...input };
        if (cleaned.description === undefined) delete cleaned.description;
        if (cleaned.dueDate === undefined) delete cleaned.dueDate;
        if (cleaned.assignedTo === undefined) delete cleaned.assignedTo;

        const result = createTaskSchema.safeParse(cleaned);
        if (result.success) {
          const reparsed = createTaskSchema.safeParse(result.data);
          expect(reparsed.success).toBe(true);
          if (reparsed.success) {
            expect(reparsed.data).toEqual(result.data);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("updateProjectSchema: round-trip preserves parsed data", () => {
    const validUpdateArb = fc.record({
      name: fc.oneof(fc.constant(undefined), nonEmptyTrimmedString(1, 100)),
      description: fc.oneof(
        fc.constant(undefined),
        fc.string({ maxLength: 500 })
      ),
      priority: fc.oneof(
        fc.constant(undefined),
        fc.constantFrom("Low", "Medium", "High")
      ),
    });

    fc.assert(
      fc.property(validUpdateArb, (input) => {
        const cleaned: Record<string, unknown> = {};
        if (input.name !== undefined) cleaned.name = input.name;
        if (input.description !== undefined)
          cleaned.description = input.description;
        if (input.priority !== undefined) cleaned.priority = input.priority;

        const result = updateProjectSchema.safeParse(cleaned);
        if (result.success) {
          const reparsed = updateProjectSchema.safeParse(result.data);
          expect(reparsed.success).toBe(true);
          if (reparsed.success) {
            expect(reparsed.data).toEqual(result.data);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("updateTaskSchema: round-trip preserves parsed data", () => {
    const validUpdateArb = fc.record({
      title: fc.oneof(fc.constant(undefined), nonEmptyTrimmedString(1, 150)),
      description: fc.oneof(
        fc.constant(undefined),
        fc.string({ maxLength: 1000 })
      ),
      priority: fc.oneof(
        fc.constant(undefined),
        fc.constantFrom("Low", "Medium", "High")
      ),
      status: fc.oneof(
        fc.constant(undefined),
        fc.constantFrom("Todo", "In Progress", "Review", "Done")
      ),
    });

    fc.assert(
      fc.property(validUpdateArb, (input) => {
        const cleaned: Record<string, unknown> = {};
        if (input.title !== undefined) cleaned.title = input.title;
        if (input.description !== undefined)
          cleaned.description = input.description;
        if (input.priority !== undefined) cleaned.priority = input.priority;
        if (input.status !== undefined) cleaned.status = input.status;

        const result = updateTaskSchema.safeParse(cleaned);
        if (result.success) {
          const reparsed = updateTaskSchema.safeParse(result.data);
          expect(reparsed.success).toBe(true);
          if (reparsed.success) {
            expect(reparsed.data).toEqual(result.data);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 2: Validator Rejects Invalid String Inputs ---

describe("Property 2: Validator Rejects Invalid String Inputs", () => {
  // Feature: project-tracker, Property 2: Validator Rejects Invalid String Inputs
  /**
   * Validates: Requirements 2.4, 2.5, 2.9, 7.4, 7.5, 7.11, 12.4, 13.5, 14.5
   *
   * For any string that violates field constraints, the validator SHALL reject
   * the input.
   */

  it("rejects project names that are empty after trimming", () => {
    const emptyNameArb = fc
      .string()
      .map((s) => " ".repeat(s.length))
      .filter((s) => s.trim().length === 0);

    fc.assert(
      fc.property(emptyNameArb, (name) => {
        const input = { name, priority: "High" };
        const result = createProjectSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects project names exceeding 100 characters", () => {
    const longNameArb = fc.string({ minLength: 101, maxLength: 300 }).filter(
      (s) => s.trim().length > 100
    );

    fc.assert(
      fc.property(longNameArb, (name) => {
        const input = { name, priority: "Medium" };
        const result = createProjectSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects project descriptions exceeding 500 characters", () => {
    const longDescArb = fc.string({ minLength: 501, maxLength: 800 });

    fc.assert(
      fc.property(longDescArb, (description) => {
        const input = { name: "Valid Name", priority: "Low", description };
        const result = createProjectSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects task titles that are empty after trimming", () => {
    const emptyTitleArb = fc
      .string()
      .map((s) => " ".repeat(s.length))
      .filter((s) => s.trim().length === 0);

    fc.assert(
      fc.property(emptyTitleArb, (title) => {
        const input = {
          title,
          priority: "High",
          projectId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        };
        const result = createTaskSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects task titles exceeding 150 characters", () => {
    const longTitleArb = fc.string({ minLength: 151, maxLength: 400 }).filter(
      (s) => s.trim().length > 150
    );

    fc.assert(
      fc.property(longTitleArb, (title) => {
        const input = {
          title,
          priority: "Low",
          projectId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        };
        const result = createTaskSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects task descriptions exceeding 1000 characters", () => {
    const longDescArb = fc.string({ minLength: 1001, maxLength: 1500 });

    fc.assert(
      fc.property(longDescArb, (description) => {
        const input = {
          title: "Valid Title",
          priority: "Medium",
          projectId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          description,
        };
        const result = createTaskSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects assignedTo exceeding 100 characters", () => {
    const longAssigneeArb = fc.string({ minLength: 101, maxLength: 200 }).filter(
      (s) => s.length > 100
    );

    fc.assert(
      fc.property(longAssigneeArb, (assignedTo) => {
        const input = {
          title: "Valid Title",
          priority: "High",
          projectId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          assignedTo,
        };
        const result = createTaskSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 3: Date Constraint Enforcement ---

describe("Property 3: Date Constraint Enforcement", () => {
  // Feature: project-tracker, Property 3: Date Constraint Enforcement
  /**
   * Validates: Requirements 2.7
   *
   * For any pair of dates where dueDate is strictly earlier than startDate,
   * the project validator SHALL reject the input. For any pair where
   * dueDate >= startDate, the validator SHALL accept the date fields.
   */

  it("rejects when dueDate is strictly earlier than startDate", () => {
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
        const input = {
          name: "Test Project",
          priority: "High",
          startDate,
          dueDate,
        };
        const result = createProjectSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("accepts when dueDate >= startDate (all other fields valid)", () => {
    const validDatesArb = fc
      .tuple(
        fc.date({ min: new Date("2000-01-01"), max: new Date("2099-12-31") }),
        fc.integer({ min: 0, max: 365 * 50 })
      )
      .map(([startDate, offsetDays]) => {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + offsetDays);
        return {
          startDate: startDate.toISOString(),
          dueDate: dueDate.toISOString(),
        };
      });

    fc.assert(
      fc.property(validDatesArb, ({ startDate, dueDate }) => {
        const input = {
          name: "Test Project",
          priority: "High",
          startDate,
          dueDate,
        };
        const result = createProjectSchema.safeParse(input);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("also enforces date constraint on updateProjectSchema", () => {
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
});

// --- Property 4: Unknown Fields Rejection ---

describe("Property 4: Unknown Fields Rejection", () => {
  // Feature: project-tracker, Property 4: Unknown Fields Rejection
  /**
   * Validates: Requirements 19.4
   *
   * For any request body containing one or more fields not defined in the schema,
   * the validator SHALL reject the entire input.
   */

  it("createProjectSchema rejects unknown fields", () => {
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
          name: "Valid Project",
          priority: "High",
          [fieldName]: fieldValue,
        };
        const result = createProjectSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("updateProjectSchema rejects unknown fields", () => {
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
          name: "Valid Project",
          [fieldName]: fieldValue,
        };
        const result = updateProjectSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("createTaskSchema rejects unknown fields", () => {
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
          title: "Valid Task",
          priority: "Low",
          projectId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          [fieldName]: fieldValue,
        };
        const result = createTaskSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("updateTaskSchema rejects unknown fields", () => {
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
          title: "Valid Task",
          [fieldName]: fieldValue,
        };
        const result = updateTaskSchema.safeParse(input);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
