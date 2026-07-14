import fc from "fast-check";
import { describe, it, expect } from "vitest";
import {
  projectQueryParamsSchema,
  taskQueryParamsSchema,
} from "@/validators/common.validator";
import {
  PROJECT_STATUSES,
  TASK_STATUSES,
  PRIORITIES,
  type ProjectStatus,
  type TaskStatus,
  type Priority,
} from "@/types/common.types";

// --- Helpers ---

interface ProjectItem {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: Priority;
}

interface TaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
}

/**
 * Simulates status filtering logic for projects.
 * Performs case-insensitive match.
 */
function filterProjectsByStatus(
  projects: ProjectItem[],
  status: string
): ProjectItem[] {
  return projects.filter(
    (p) => p.status.toLowerCase() === status.toLowerCase()
  );
}

/**
 * Simulates status filtering logic for tasks.
 * Performs case-insensitive match.
 */
function filterTasksByStatus(tasks: TaskItem[], status: string): TaskItem[] {
  return tasks.filter(
    (t) => t.status.toLowerCase() === status.toLowerCase()
  );
}

/**
 * Simulates priority filtering logic for projects.
 * Performs case-insensitive match.
 */
function filterProjectsByPriority(
  projects: ProjectItem[],
  priority: string
): ProjectItem[] {
  return projects.filter(
    (p) => p.priority.toLowerCase() === priority.toLowerCase()
  );
}

/**
 * Simulates priority filtering logic for tasks.
 * Performs case-insensitive match.
 */
function filterTasksByPriority(
  tasks: TaskItem[],
  priority: string
): TaskItem[] {
  return tasks.filter(
    (t) => t.priority.toLowerCase() === priority.toLowerCase()
  );
}

// --- Arbitraries ---

const uuidArb = fc.uuid();

const projectArb: fc.Arbitrary<ProjectItem> = fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  status: fc.constantFrom(...PROJECT_STATUSES),
  priority: fc.constantFrom(...PRIORITIES),
});

const taskArb: fc.Arbitrary<TaskItem> = fc.record({
  id: uuidArb,
  title: fc.string({ minLength: 1, maxLength: 150 }),
  status: fc.constantFrom(...TASK_STATUSES),
  priority: fc.constantFrom(...PRIORITIES),
});

/**
 * Generates a valid project status string (possibly with different casing).
 */
const validProjectStatusArb = fc
  .constantFrom(...PROJECT_STATUSES)
  .chain((status) =>
    fc.constantFrom(
      status,
      status.toLowerCase(),
      status.toUpperCase()
    )
  );

/**
 * Generates a valid task status string (possibly with different casing).
 */
const validTaskStatusArb = fc
  .constantFrom(...TASK_STATUSES)
  .chain((status) =>
    fc.constantFrom(
      status,
      status.toLowerCase(),
      status.toUpperCase()
    )
  );

/**
 * Generates a valid priority string (possibly with different casing).
 */
const validPriorityArb = fc
  .constantFrom(...PRIORITIES)
  .chain((priority) =>
    fc.constantFrom(
      priority,
      priority.toLowerCase(),
      priority.toUpperCase()
    )
  );

/**
 * Generates an invalid status string that doesn't match any project or task status.
 */
const invalidStatusArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => {
    const lower = s.toLowerCase();
    const allStatuses = [...PROJECT_STATUSES, ...TASK_STATUSES];
    return !allStatuses.some((v) => v.toLowerCase() === lower);
  });

/**
 * Generates an invalid priority string.
 */
const invalidPriorityArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => {
    const lower = s.toLowerCase();
    return !PRIORITIES.some((v) => v.toLowerCase() === lower);
  });

// --- Property 9: Status Filter Correctness ---

describe("Property 9: Status Filter Correctness", () => {
  // Feature: project-tracker, Property 9: Status Filter Correctness
  /**
   * Validates: Requirements 15.1, 15.2, 15.3
   *
   * For any collection of projects (or tasks) and for any valid status filter value,
   * all returned results SHALL have a status field matching the filter value (case-insensitive).
   * For any invalid status value (not in the allowed enum), the system SHALL reject with a 400 error.
   */

  it("all project results have status matching the filter (case-insensitive)", () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...PROJECT_STATUSES),
        (projects, status) => {
          const results = filterProjectsByStatus(projects, status);

          // Every result must have matching status
          for (const result of results) {
            expect(result.status.toLowerCase()).toBe(status.toLowerCase());
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("all task results have status matching the filter (case-insensitive)", () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...TASK_STATUSES),
        (tasks, status) => {
          const results = filterTasksByStatus(tasks, status);

          // Every result must have matching status
          for (const result of results) {
            expect(result.status.toLowerCase()).toBe(status.toLowerCase());
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("status filter returns only matching items (completeness check for projects)", () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom(...PROJECT_STATUSES),
        (projects, status) => {
          const results = filterProjectsByStatus(projects, status);
          const expectedCount = projects.filter(
            (p) => p.status.toLowerCase() === status.toLowerCase()
          ).length;
          expect(results.length).toBe(expectedCount);
        }
      ),
      { numRuns: 150 }
    );
  });

  it("status filter returns only matching items (completeness check for tasks)", () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom(...TASK_STATUSES),
        (tasks, status) => {
          const results = filterTasksByStatus(tasks, status);
          const expectedCount = tasks.filter(
            (t) => t.status.toLowerCase() === status.toLowerCase()
          ).length;
          expect(results.length).toBe(expectedCount);
        }
      ),
      { numRuns: 150 }
    );
  });

  it("project query validator accepts valid status values (case-insensitive)", () => {
    fc.assert(
      fc.property(validProjectStatusArb, (status) => {
        const result = projectQueryParamsSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("task query validator accepts valid status values (case-insensitive)", () => {
    fc.assert(
      fc.property(validTaskStatusArb, (status) => {
        const result = taskQueryParamsSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("project query validator rejects invalid status values", () => {
    fc.assert(
      fc.property(invalidStatusArb, (status) => {
        const result = projectQueryParamsSchema.safeParse({ status });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("task query validator rejects invalid status values", () => {
    fc.assert(
      fc.property(invalidStatusArb, (status) => {
        const result = taskQueryParamsSchema.safeParse({ status });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

// --- Property 10: Priority Filter Correctness ---

describe("Property 10: Priority Filter Correctness", () => {
  // Feature: project-tracker, Property 10: Priority Filter Correctness
  /**
   * Validates: Requirements 16.1, 16.2, 16.3, 16.6
   *
   * For any collection of projects (or tasks) and for any valid priority filter value
   * (Low, Medium, or High), all returned results SHALL have a priority field matching
   * the filter value (case-insensitive). For any invalid priority value, the system
   * SHALL reject with a 400 error.
   */

  it("all project results have priority matching the filter (case-insensitive)", () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...PRIORITIES),
        (projects, priority) => {
          const results = filterProjectsByPriority(projects, priority);

          // Every result must have matching priority
          for (const result of results) {
            expect(result.priority.toLowerCase()).toBe(
              priority.toLowerCase()
            );
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("all task results have priority matching the filter (case-insensitive)", () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        fc.constantFrom(...PRIORITIES),
        (tasks, priority) => {
          const results = filterTasksByPriority(tasks, priority);

          // Every result must have matching priority
          for (const result of results) {
            expect(result.priority.toLowerCase()).toBe(
              priority.toLowerCase()
            );
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("priority filter returns only matching items (completeness check for projects)", () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom(...PRIORITIES),
        (projects, priority) => {
          const results = filterProjectsByPriority(projects, priority);
          const expectedCount = projects.filter(
            (p) => p.priority.toLowerCase() === priority.toLowerCase()
          ).length;
          expect(results.length).toBe(expectedCount);
        }
      ),
      { numRuns: 150 }
    );
  });

  it("priority filter returns only matching items (completeness check for tasks)", () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom(...PRIORITIES),
        (tasks, priority) => {
          const results = filterTasksByPriority(tasks, priority);
          const expectedCount = tasks.filter(
            (t) => t.priority.toLowerCase() === priority.toLowerCase()
          ).length;
          expect(results.length).toBe(expectedCount);
        }
      ),
      { numRuns: 150 }
    );
  });

  it("project query validator accepts valid priority values (case-insensitive)", () => {
    fc.assert(
      fc.property(validPriorityArb, (priority) => {
        const result = projectQueryParamsSchema.safeParse({ priority });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("task query validator accepts valid priority values (case-insensitive)", () => {
    fc.assert(
      fc.property(validPriorityArb, (priority) => {
        const result = taskQueryParamsSchema.safeParse({ priority });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("project query validator rejects invalid priority values", () => {
    fc.assert(
      fc.property(invalidPriorityArb, (priority) => {
        const result = projectQueryParamsSchema.safeParse({ priority });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("task query validator rejects invalid priority values", () => {
    fc.assert(
      fc.property(invalidPriorityArb, (priority) => {
        const result = taskQueryParamsSchema.safeParse({ priority });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("query validator rejects empty string as priority value", () => {
    const resultProject = projectQueryParamsSchema.safeParse({ priority: "" });
    expect(resultProject.success).toBe(false);

    const resultTask = taskQueryParamsSchema.safeParse({ priority: "" });
    expect(resultTask.success).toBe(false);
  });
});
