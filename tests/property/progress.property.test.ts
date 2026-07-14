import fc from "fast-check";
import { describe, it, expect } from "vitest";
import { calculateProjectProgress } from "@/utils/progress.utils";

// Feature: project-tracker, Property 7: Progress Calculation Correctness

describe("Property 7: Progress Calculation Correctness", () => {
  /**
   * Validates: Requirements 18.1, 18.2, 9.5, 10.2, 6.4
   *
   * For any non-negative integer totalTasks and doneTasks where doneTasks <= totalTasks:
   * - Returns floor(doneTasks / totalTasks * 100) when totalTasks > 0
   * - Returns 0 when totalTasks == 0
   * - Result is always between 0 and 100 inclusive
   * - Result is always an integer
   */

  it("returns floor(doneTasks / totalTasks * 100) when totalTasks > 0", () => {
    const validInputArb = fc
      .integer({ min: 1, max: 10000 })
      .chain((totalTasks) =>
        fc.tuple(
          fc.constant(totalTasks),
          fc.integer({ min: 0, max: totalTasks })
        )
      );

    fc.assert(
      fc.property(validInputArb, ([totalTasks, doneTasks]) => {
        const result = calculateProjectProgress(totalTasks, doneTasks);
        const expected = Math.floor((doneTasks / totalTasks) * 100);
        expect(result).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it("returns 0 when totalTasks == 0", () => {
    const zeroTotalArb = fc.constant(0);

    fc.assert(
      fc.property(zeroTotalArb, (totalTasks) => {
        const result = calculateProjectProgress(totalTasks, 0);
        expect(result).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("result is always between 0 and 100 inclusive", () => {
    const validInputArb = fc
      .integer({ min: 0, max: 10000 })
      .chain((totalTasks) =>
        fc.tuple(
          fc.constant(totalTasks),
          fc.integer({ min: 0, max: Math.max(totalTasks, 0) })
        )
      );

    fc.assert(
      fc.property(validInputArb, ([totalTasks, doneTasks]) => {
        const result = calculateProjectProgress(totalTasks, doneTasks);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }),
      { numRuns: 200 }
    );
  });

  it("result is always an integer", () => {
    const validInputArb = fc
      .integer({ min: 0, max: 10000 })
      .chain((totalTasks) =>
        fc.tuple(
          fc.constant(totalTasks),
          fc.integer({ min: 0, max: Math.max(totalTasks, 0) })
        )
      );

    fc.assert(
      fc.property(validInputArb, ([totalTasks, doneTasks]) => {
        const result = calculateProjectProgress(totalTasks, doneTasks);
        expect(Number.isInteger(result)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it("returns exactly 100 when all tasks are done (doneTasks === totalTasks > 0)", () => {
    const allDoneArb = fc.integer({ min: 1, max: 10000 });

    fc.assert(
      fc.property(allDoneArb, (totalTasks) => {
        const result = calculateProjectProgress(totalTasks, totalTasks);
        expect(result).toBe(100);
      }),
      { numRuns: 200 }
    );
  });

  it("returns 0 when no tasks are done (doneTasks === 0, totalTasks > 0)", () => {
    const noDoneArb = fc.integer({ min: 1, max: 10000 });

    fc.assert(
      fc.property(noDoneArb, (totalTasks) => {
        const result = calculateProjectProgress(totalTasks, 0);
        expect(result).toBe(0);
      }),
      { numRuns: 200 }
    );
  });
});
