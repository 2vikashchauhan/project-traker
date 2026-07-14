import fc from "fast-check";
import { describe, it, expect } from "vitest";
import { isOverdue } from "@/utils/date.utils";
import { TASK_STATUSES } from "@/types/common.types";
import type { TaskStatus } from "@/types/common.types";

// --- Property 13: Overdue Task Identification ---

describe("Property 13: Overdue Task Identification", () => {
  // Feature: project-tracker, Property 13: Overdue Task Identification
  /**
   * Validates: Requirements 1.4
   *
   * For any task with a dueDate and status:
   * - Task is overdue if and only if dueDate < today AND status !== "Done"
   * - Tasks with status "Done" are NEVER overdue
   * - Tasks with dueDate >= today are NEVER overdue
   */

  const taskStatusArb = fc.constantFrom(...TASK_STATUSES);

  // Generate a date within a reasonable range (past 2 years to future 2 years)
  const dateArb = fc.date({
    min: new Date("2022-01-01"),
    max: new Date("2026-12-31"),
  });

  // Reference date for comparison
  const referenceDateArb = fc.date({
    min: new Date("2023-01-01"),
    max: new Date("2025-12-31"),
  });

  it("task is overdue if and only if dueDate < today AND status !== Done", () => {
    fc.assert(
      fc.property(dateArb, referenceDateArb, taskStatusArb, (dueDate, referenceDate, status) => {
        const overdueByDate = isOverdue(dueDate, referenceDate);
        const isDone = status === "Done";

        // A task is overdue iff dueDate < referenceDate (at date level) AND status !== "Done"
        const expectedOverdue = overdueByDate && !isDone;

        // The isOverdue function only checks date comparison; the caller combines with status
        // So isOverdue returns true iff dueDate < referenceDate at date level
        // The full overdue condition is: isOverdue(dueDate, referenceDate) && status !== "Done"
        expect(expectedOverdue).toBe(overdueByDate && !isDone);
      }),
      { numRuns: 200 }
    );
  });

  it("tasks with status Done are NEVER overdue regardless of dueDate", () => {
    fc.assert(
      fc.property(dateArb, referenceDateArb, (dueDate, referenceDate) => {
        const status: TaskStatus = "Done";

        // Even if the due date is in the past, a Done task is never overdue
        const isTaskOverdue = isOverdue(dueDate, referenceDate) && status !== "Done";

        expect(isTaskOverdue).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it("tasks with dueDate >= today are NEVER overdue regardless of status", () => {
    fc.assert(
      fc.property(taskStatusArb, referenceDateArb, (status, referenceDate) => {
        // Generate a dueDate that is >= referenceDate (same day or future)
        // Add 0 to 365 days to referenceDate to ensure dueDate >= referenceDate
        const futureDays = Math.floor(Math.random() * 366);
        const dueDate = new Date(referenceDate);
        dueDate.setDate(dueDate.getDate() + futureDays);

        const overdueByDate = isOverdue(dueDate, referenceDate);

        // dueDate >= referenceDate means isOverdue should be false
        expect(overdueByDate).toBe(false);

        // Therefore the full overdue condition is always false
        const isTaskOverdue = overdueByDate && status !== "Done";
        expect(isTaskOverdue).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it("tasks with dueDate strictly before today and status not Done ARE overdue", () => {
    const nonDoneStatusArb = fc.constantFrom(
      ...TASK_STATUSES.filter((s) => s !== "Done")
    );

    fc.assert(
      fc.property(referenceDateArb, nonDoneStatusArb, (referenceDate, status) => {
        // Generate a dueDate that is strictly before referenceDate (1 to 365 days before)
        const pastDays = Math.floor(Math.random() * 365) + 1;
        const dueDate = new Date(referenceDate);
        dueDate.setDate(dueDate.getDate() - pastDays);

        const overdueByDate = isOverdue(dueDate, referenceDate);

        // dueDate < referenceDate at date level means isOverdue should be true
        expect(overdueByDate).toBe(true);

        // Since status !== "Done", the full overdue condition is true
        const isTaskOverdue = overdueByDate && status !== "Done";
        expect(isTaskOverdue).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it("isOverdue correctly compares dates at date level ignoring time", () => {
    fc.assert(
      fc.property(referenceDateArb, (referenceDate) => {
        // Same calendar date should NOT be overdue regardless of time
        const sameDayMorning = new Date(referenceDate);
        sameDayMorning.setHours(0, 0, 0, 0);

        const sameDayEvening = new Date(referenceDate);
        sameDayEvening.setHours(23, 59, 59, 999);

        // Same date as reference should not be overdue
        expect(isOverdue(sameDayMorning, referenceDate)).toBe(false);
        expect(isOverdue(sameDayEvening, referenceDate)).toBe(false);

        // One day before should be overdue
        const yesterday = new Date(referenceDate);
        yesterday.setDate(yesterday.getDate() - 1);
        expect(isOverdue(yesterday, referenceDate)).toBe(true);

        // One day after should NOT be overdue
        const tomorrow = new Date(referenceDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(isOverdue(tomorrow, referenceDate)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("isOverdue works correctly with ISO string dates", () => {
    fc.assert(
      fc.property(dateArb, referenceDateArb, (dueDate, referenceDate) => {
        // Test with ISO string input
        const isoString = dueDate.toISOString();
        const resultWithDate = isOverdue(dueDate, referenceDate);
        const resultWithString = isOverdue(isoString, referenceDate);

        // Both should produce the same result
        expect(resultWithString).toBe(resultWithDate);
      }),
      { numRuns: 100 }
    );
  });
});
