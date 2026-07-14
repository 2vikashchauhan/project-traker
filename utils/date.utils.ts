/**
 * Date utility functions for the Project Tracker.
 */

/**
 * Normalizes a date input (Date object or ISO string) to a Date object.
 */
function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

/**
 * Checks if a due date is overdue (strictly before the reference date at midnight).
 * A task is overdue when its due date is earlier than today and it hasn't been completed.
 * Comparison is done at the date level (ignoring time).
 */
export function isOverdue(
  dueDate: Date | string,
  referenceDate: Date = new Date()
): boolean {
  const due = toDate(dueDate);
  const dueDay = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const refDay = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  return dueDay < refDay;
}

/**
 * Checks if a due date is upcoming (within the specified number of days from the reference date).
 * Returns true if the due date falls between the reference date (inclusive) and
 * referenceDate + days (inclusive). Comparison is done at the date level (ignoring time).
 */
export function isUpcoming(
  dueDate: Date | string,
  days: number,
  referenceDate: Date = new Date()
): boolean {
  const due = toDate(dueDate);
  // Normalize to UTC date components for date-level comparison
  const dueDay = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const refDay = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const endDay = refDay + days * 24 * 60 * 60 * 1000;

  return dueDay >= refDay && dueDay <= endDay;
}

/**
 * Formats a date as an ISO 8601 date string (YYYY-MM-DD).
 */
export function formatDate(date: Date | string): string {
  const d = toDate(date);
  return d.toISOString().split("T")[0];
}

/**
 * Compares two dates for sorting purposes.
 * Handles null values: nulls appear last in ascending order, first in descending order.
 *
 * @returns negative if a should come before b, positive if b should come before a, 0 if equal
 */
export function compareDates(
  a: Date | string | null,
  b: Date | string | null,
  order: "asc" | "desc" = "asc"
): number {
  const aIsNull = a === null;
  const bIsNull = b === null;

  if (aIsNull && bIsNull) return 0;

  if (order === "asc") {
    if (aIsNull) return 1; // nulls last in ascending
    if (bIsNull) return -1;
  } else {
    if (aIsNull) return -1; // nulls first in descending
    if (bIsNull) return 1;
  }

  const dateA = toDate(a!);
  const dateB = toDate(b!);
  const diff = dateA.getTime() - dateB.getTime();

  return order === "asc" ? diff : -diff;
}
