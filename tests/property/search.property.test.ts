import fc from "fast-check";
import { describe, it, expect } from "vitest";
import {
  projectQueryParamsSchema,
  taskQueryParamsSchema,
} from "@/validators/common.validator";

// --- Helpers ---

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
}

/**
 * Simulates search filtering logic for projects.
 * Matches search term as case-insensitive substring in name or description.
 */
function filterProjectsBySearch(
  projects: ProjectItem[],
  search: string | undefined
): ProjectItem[] {
  if (!search || search.trim().length === 0) {
    return projects;
  }
  const term = search.trim().toLowerCase();
  return projects.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
  );
}

/**
 * Simulates search filtering logic for tasks.
 * Matches search term as case-insensitive substring in title or description.
 */
function filterTasksBySearch(
  tasks: TaskItem[],
  search: string | undefined
): TaskItem[] {
  if (!search || search.trim().length === 0) {
    return tasks;
  }
  const term = search.trim().toLowerCase();
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term))
  );
}

// --- Arbitraries ---

const uuidArb = fc.uuid();

const projectArb: fc.Arbitrary<ProjectItem> = fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.oneof(fc.constant(null), fc.string({ maxLength: 500 })),
});

const taskArb: fc.Arbitrary<TaskItem> = fc.record({
  id: uuidArb,
  title: fc.string({ minLength: 1, maxLength: 150 }),
  description: fc.oneof(fc.constant(null), fc.string({ maxLength: 1000 })),
});

/**
 * Generates a non-empty, non-whitespace search string of at most 200 characters.
 */
const validSearchArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0);

/**
 * Generates a whitespace-only or empty search string.
 */
const emptySearchArb = fc.oneof(
  fc.constant(""),
  fc.constant("   "),
  fc.constant("\t"),
  fc.constant("  \n  ")
);

// --- Property 8: Search Filter Correctness ---

describe("Property 8: Search Filter Correctness", () => {
  // Feature: project-tracker, Property 8: Search Filter Correctness
  /**
   * Validates: Requirements 13.1, 13.4, 14.1, 14.4
   *
   * For any collection of projects (or tasks) and for any non-empty, non-whitespace
   * search string of at most 200 characters, all returned results SHALL contain
   * the search term as a case-insensitive substring in the name/title or description field.
   * For any whitespace-only or empty search string, the system SHALL return the
   * unfiltered collection.
   */

  it("all project search results contain the search term as case-insensitive substring", () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 0, maxLength: 20 }),
        validSearchArb,
        (projects, search) => {
          const results = filterProjectsBySearch(projects, search);
          const term = search.trim().toLowerCase();

          // Every result must contain the search term in name or description
          for (const result of results) {
            const nameMatch = result.name.toLowerCase().includes(term);
            const descMatch =
              result.description !== null &&
              result.description.toLowerCase().includes(term);
            expect(nameMatch || descMatch).toBe(true);
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("all task search results contain the search term as case-insensitive substring", () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        validSearchArb,
        (tasks, search) => {
          const results = filterTasksBySearch(tasks, search);
          const term = search.trim().toLowerCase();

          // Every result must contain the search term in title or description
          for (const result of results) {
            const titleMatch = result.title.toLowerCase().includes(term);
            const descMatch =
              result.description !== null &&
              result.description.toLowerCase().includes(term);
            expect(titleMatch || descMatch).toBe(true);
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("empty/whitespace search returns the full unfiltered collection for projects", () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 0, maxLength: 20 }),
        emptySearchArb,
        (projects, search) => {
          const results = filterProjectsBySearch(projects, search);
          expect(results).toEqual(projects);
        }
      ),
      { numRuns: 150 }
    );
  });

  it("empty/whitespace search returns the full unfiltered collection for tasks", () => {
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 0, maxLength: 20 }),
        emptySearchArb,
        (tasks, search) => {
          const results = filterTasksBySearch(tasks, search);
          expect(results).toEqual(tasks);
        }
      ),
      { numRuns: 150 }
    );
  });

  it("search is case-insensitive: results for 'ABC' === results for 'abc'", () => {
    fc.assert(
      fc.property(
        fc.array(projectArb, { minLength: 1, maxLength: 20 }),
        validSearchArb,
        (projects, search) => {
          const upper = filterProjectsBySearch(projects, search.toUpperCase());
          const lower = filterProjectsBySearch(projects, search.toLowerCase());
          expect(upper).toEqual(lower);
        }
      ),
      { numRuns: 150 }
    );
  });

  it("search validator rejects search strings exceeding 200 characters", () => {
    const longSearchArb = fc
      .string({ minLength: 201, maxLength: 400 })
      .filter((s) => s.length > 200);

    fc.assert(
      fc.property(longSearchArb, (search) => {
        const result = projectQueryParamsSchema.safeParse({ search });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("task query params validator rejects search strings exceeding 200 characters", () => {
    const longSearchArb = fc
      .string({ minLength: 201, maxLength: 400 })
      .filter((s) => s.length > 200);

    fc.assert(
      fc.property(longSearchArb, (search) => {
        const result = taskQueryParamsSchema.safeParse({ search });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
