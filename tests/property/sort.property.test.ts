import fc from "fast-check";
import { describe, it, expect } from "vitest";
import { compareDates } from "@/utils/date.utils";

// --- Helpers ---

interface EntityWithDueDate {
  id: string;
  name: string;
  dueDate: Date | string | null;
}

/**
 * Sorts entities by dueDate using the compareDates utility.
 * In ascending order: nulls last.
 * In descending order: nulls first.
 */
function sortByDueDate(
  entities: EntityWithDueDate[],
  order: "asc" | "desc"
): EntityWithDueDate[] {
  return [...entities].sort((a, b) => compareDates(a.dueDate, b.dueDate, order));
}

// --- Arbitraries ---

const uuidArb = fc.uuid();

/**
 * Generates a nullable date (as ISO string or null).
 */
const nullableDateArb = fc.oneof(
  fc.constant(null),
  fc
    .date({ min: new Date("2000-01-01"), max: new Date("2099-12-31") })
    .map((d) => d.toISOString())
);

/**
 * Generates a non-null date as ISO string.
 */
const nonNullDateArb = fc
  .date({ min: new Date("2000-01-01"), max: new Date("2099-12-31") })
  .map((d) => d.toISOString());

/**
 * Generates an entity with a nullable dueDate.
 */
const entityArb: fc.Arbitrary<EntityWithDueDate> = fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  dueDate: nullableDateArb,
});

/**
 * Generates an entity with a non-null dueDate.
 */
const entityWithDateArb: fc.Arbitrary<EntityWithDueDate> = fc.record({
  id: uuidArb,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  dueDate: nonNullDateArb,
});

// --- Property 11: Sort Ordering Correctness ---

describe("Property 11: Sort Ordering Correctness", () => {
  // Feature: project-tracker, Property 11: Sort Ordering Correctness
  /**
   * Validates: Requirements 17.1, 17.2, 17.5
   *
   * For any collection of entities with dueDate fields, when sorted by dueDate
   * ascending, each entity's dueDate SHALL be less than or equal to the next entity's
   * dueDate, with null dueDates appearing last. When sorted descending, each entity's
   * dueDate SHALL be greater than or equal to the next, with null dueDates appearing first.
   */

  it("ascending sort: each dueDate <= next dueDate (non-null entries)", () => {
    fc.assert(
      fc.property(
        fc.array(entityWithDateArb, { minLength: 2, maxLength: 30 }),
        (entities) => {
          const sorted = sortByDueDate(entities, "asc");

          for (let i = 0; i < sorted.length - 1; i++) {
            const current = new Date(sorted[i].dueDate as string).getTime();
            const next = new Date(sorted[i + 1].dueDate as string).getTime();
            expect(current).toBeLessThanOrEqual(next);
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("descending sort: each dueDate >= next dueDate (non-null entries)", () => {
    fc.assert(
      fc.property(
        fc.array(entityWithDateArb, { minLength: 2, maxLength: 30 }),
        (entities) => {
          const sorted = sortByDueDate(entities, "desc");

          for (let i = 0; i < sorted.length - 1; i++) {
            const current = new Date(sorted[i].dueDate as string).getTime();
            const next = new Date(sorted[i + 1].dueDate as string).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("ascending sort: null dueDates appear last", () => {
    fc.assert(
      fc.property(
        fc.array(entityArb, { minLength: 2, maxLength: 30 }).filter(
          (entities) =>
            entities.some((e) => e.dueDate !== null) &&
            entities.some((e) => e.dueDate === null)
        ),
        (entities) => {
          const sorted = sortByDueDate(entities, "asc");

          // Find the first null dueDate index
          const firstNullIdx = sorted.findIndex((e) => e.dueDate === null);

          if (firstNullIdx >= 0) {
            // All entries after first null should also be null
            for (let i = firstNullIdx; i < sorted.length; i++) {
              expect(sorted[i].dueDate).toBeNull();
            }
            // All entries before first null should be non-null
            for (let i = 0; i < firstNullIdx; i++) {
              expect(sorted[i].dueDate).not.toBeNull();
            }
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("descending sort: null dueDates appear first", () => {
    fc.assert(
      fc.property(
        fc.array(entityArb, { minLength: 2, maxLength: 30 }).filter(
          (entities) =>
            entities.some((e) => e.dueDate !== null) &&
            entities.some((e) => e.dueDate === null)
        ),
        (entities) => {
          const sorted = sortByDueDate(entities, "desc");

          // Find the last null dueDate index
          const lastNullIdx = sorted.reduce(
            (acc, e, idx) => (e.dueDate === null ? idx : acc),
            -1
          );

          if (lastNullIdx >= 0) {
            // All entries from index 0 to lastNullIdx should be null
            for (let i = 0; i <= lastNullIdx; i++) {
              expect(sorted[i].dueDate).toBeNull();
            }
            // All entries after lastNullIdx should be non-null
            for (let i = lastNullIdx + 1; i < sorted.length; i++) {
              expect(sorted[i].dueDate).not.toBeNull();
            }
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("ascending sort: non-null entries before nulls are in ascending order", () => {
    fc.assert(
      fc.property(
        fc.array(entityArb, { minLength: 2, maxLength: 30 }),
        (entities) => {
          const sorted = sortByDueDate(entities, "asc");
          const nonNullEntries = sorted.filter((e) => e.dueDate !== null);

          for (let i = 0; i < nonNullEntries.length - 1; i++) {
            const current = new Date(
              nonNullEntries[i].dueDate as string
            ).getTime();
            const next = new Date(
              nonNullEntries[i + 1].dueDate as string
            ).getTime();
            expect(current).toBeLessThanOrEqual(next);
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("descending sort: non-null entries after nulls are in descending order", () => {
    fc.assert(
      fc.property(
        fc.array(entityArb, { minLength: 2, maxLength: 30 }),
        (entities) => {
          const sorted = sortByDueDate(entities, "desc");
          const nonNullEntries = sorted.filter((e) => e.dueDate !== null);

          for (let i = 0; i < nonNullEntries.length - 1; i++) {
            const current = new Date(
              nonNullEntries[i].dueDate as string
            ).getTime();
            const next = new Date(
              nonNullEntries[i + 1].dueDate as string
            ).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it("sorting preserves collection size (no elements lost or added)", () => {
    fc.assert(
      fc.property(
        fc.array(entityArb, { minLength: 0, maxLength: 30 }),
        fc.constantFrom("asc" as const, "desc" as const),
        (entities, order) => {
          const sorted = sortByDueDate(entities, order);
          expect(sorted.length).toBe(entities.length);
        }
      ),
      { numRuns: 150 }
    );
  });

  it("compareDates utility: null vs null returns 0", () => {
    expect(compareDates(null, null, "asc")).toBe(0);
    expect(compareDates(null, null, "desc")).toBe(0);
  });

  it("compareDates utility: consistency across sort orders for non-null dates", () => {
    fc.assert(
      fc.property(nonNullDateArb, nonNullDateArb, (dateA, dateB) => {
        const ascResult = compareDates(dateA, dateB, "asc");
        const descResult = compareDates(dateA, dateB, "desc");

        // If dates are equal, both should be 0 (use == to handle -0 vs +0)
        if (ascResult == 0) {
          expect(descResult == 0).toBe(true);
        } else {
          // Otherwise, the sign should be flipped
          expect(Math.sign(ascResult)).toBe(-Math.sign(descResult));
        }
      }),
      { numRuns: 150 }
    );
  });

  it("compareDates utility: null handling in ascending (null last)", () => {
    fc.assert(
      fc.property(nonNullDateArb, (date) => {
        // null should come after any non-null date in ascending
        const result = compareDates(null, date, "asc");
        expect(result).toBeGreaterThan(0); // null is "larger" -> goes last

        const result2 = compareDates(date, null, "asc");
        expect(result2).toBeLessThan(0); // non-null is "smaller" -> goes first
      }),
      { numRuns: 100 }
    );
  });

  it("compareDates utility: null handling in descending (null first)", () => {
    fc.assert(
      fc.property(nonNullDateArb, (date) => {
        // null should come before any non-null date in descending
        const result = compareDates(null, date, "desc");
        expect(result).toBeLessThan(0); // null is "smaller" -> goes first

        const result2 = compareDates(date, null, "desc");
        expect(result2).toBeGreaterThan(0); // non-null is "larger" -> goes last
      }),
      { numRuns: 100 }
    );
  });
});
