import { describe, it, expect } from "vitest";
import { calculateProjectProgress } from "@/utils/progress.utils";

describe("calculateProjectProgress", () => {
  it("returns 0 when there are no tasks", () => {
    expect(calculateProjectProgress(0, 0)).toBe(0);
  });

  it("returns 100 when all tasks are done", () => {
    expect(calculateProjectProgress(5, 5)).toBe(100);
  });

  it("returns 0 when no tasks are done", () => {
    expect(calculateProjectProgress(10, 0)).toBe(0);
  });

  it("floors the result to the nearest integer", () => {
    // 1/3 = 33.33...% → should return 33
    expect(calculateProjectProgress(3, 1)).toBe(33);
    // 2/3 = 66.66...% → should return 66
    expect(calculateProjectProgress(3, 2)).toBe(66);
  });

  it("handles single task done", () => {
    expect(calculateProjectProgress(1, 1)).toBe(100);
  });

  it("calculates correctly for various ratios", () => {
    expect(calculateProjectProgress(4, 1)).toBe(25);
    expect(calculateProjectProgress(4, 2)).toBe(50);
    expect(calculateProjectProgress(4, 3)).toBe(75);
  });
});
