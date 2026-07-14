import { describe, it, expect } from "vitest";
import {
  isOverdue,
  isUpcoming,
  formatDate,
  compareDates,
} from "@/utils/date.utils";

describe("isOverdue", () => {
  it("returns true when due date is before reference date", () => {
    const referenceDate = new Date(2024, 5, 15); // June 15, 2024
    expect(isOverdue("2024-06-14", referenceDate)).toBe(true);
    expect(isOverdue(new Date(2024, 5, 14), referenceDate)).toBe(true);
  });

  it("returns false when due date is the same day as reference date", () => {
    const referenceDate = new Date(2024, 5, 15); // June 15, 2024
    expect(isOverdue("2024-06-15", referenceDate)).toBe(false);
  });

  it("returns false when due date is after reference date", () => {
    const referenceDate = new Date(2024, 5, 15);
    expect(isOverdue("2024-06-20", referenceDate)).toBe(false);
  });

  it("accepts string dates", () => {
    const referenceDate = new Date(2024, 5, 15);
    expect(isOverdue("2024-06-10", referenceDate)).toBe(true);
  });
});

describe("isUpcoming", () => {
  it("returns true when due date is within the specified days", () => {
    const referenceDate = new Date(2024, 5, 15); // June 15, 2024
    expect(isUpcoming("2024-06-15", 7, referenceDate)).toBe(true); // same day
    expect(isUpcoming("2024-06-20", 7, referenceDate)).toBe(true); // 5 days later
    expect(isUpcoming("2024-06-22", 7, referenceDate)).toBe(true); // 7 days later
  });

  it("returns false when due date is beyond the specified days", () => {
    const referenceDate = new Date(2024, 5, 15);
    expect(isUpcoming("2024-06-23", 7, referenceDate)).toBe(false); // 8 days later
  });

  it("returns false when due date is before the reference date", () => {
    const referenceDate = new Date(2024, 5, 15);
    expect(isUpcoming("2024-06-14", 7, referenceDate)).toBe(false);
  });
});

describe("formatDate", () => {
  it("formats a Date object to ISO date string", () => {
    const date = new Date("2024-06-15T00:00:00.000Z");
    expect(formatDate(date)).toBe("2024-06-15");
  });

  it("formats a string date to ISO date string", () => {
    expect(formatDate("2024-01-01T12:00:00.000Z")).toBe("2024-01-01");
  });
});

describe("compareDates", () => {
  it("returns negative when a is before b in ascending order", () => {
    expect(compareDates("2024-01-01", "2024-06-01", "asc")).toBeLessThan(0);
  });

  it("returns positive when a is after b in ascending order", () => {
    expect(compareDates("2024-06-01", "2024-01-01", "asc")).toBeGreaterThan(0);
  });

  it("returns 0 when dates are equal", () => {
    expect(compareDates("2024-06-01", "2024-06-01", "asc")).toBe(0);
  });

  it("reverses order for descending", () => {
    expect(compareDates("2024-01-01", "2024-06-01", "desc")).toBeGreaterThan(0);
    expect(compareDates("2024-06-01", "2024-01-01", "desc")).toBeLessThan(0);
  });

  it("places nulls last in ascending order", () => {
    expect(compareDates(null, "2024-06-01", "asc")).toBeGreaterThan(0);
    expect(compareDates("2024-06-01", null, "asc")).toBeLessThan(0);
  });

  it("places nulls first in descending order", () => {
    expect(compareDates(null, "2024-06-01", "desc")).toBeLessThan(0);
    expect(compareDates("2024-06-01", null, "desc")).toBeGreaterThan(0);
  });

  it("returns 0 when both are null", () => {
    expect(compareDates(null, null, "asc")).toBe(0);
    expect(compareDates(null, null, "desc")).toBe(0);
  });
});
