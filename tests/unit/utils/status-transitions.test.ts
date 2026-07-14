import { describe, it, expect } from "vitest";
import {
  PROJECT_STATUS_TRANSITIONS,
  TASK_STATUS_TRANSITIONS,
  isValidProjectTransition,
  isValidTaskTransition,
  getAllowedProjectTransitions,
  getAllowedTaskTransitions,
} from "@/utils/status-transitions";

describe("status-transitions", () => {
  describe("PROJECT_STATUS_TRANSITIONS", () => {
    it("allows Planned to transition to In Progress or Cancelled", () => {
      expect(PROJECT_STATUS_TRANSITIONS["Planned"]).toEqual([
        "In Progress",
        "Cancelled",
      ]);
    });

    it("allows In Progress to transition to Completed, On Hold, or Cancelled", () => {
      expect(PROJECT_STATUS_TRANSITIONS["In Progress"]).toEqual([
        "Completed",
        "On Hold",
        "Cancelled",
      ]);
    });

    it("allows no transitions from Completed", () => {
      expect(PROJECT_STATUS_TRANSITIONS["Completed"]).toEqual([]);
    });

    it("allows On Hold to transition to In Progress or Cancelled", () => {
      expect(PROJECT_STATUS_TRANSITIONS["On Hold"]).toEqual([
        "In Progress",
        "Cancelled",
      ]);
    });

    it("allows no transitions from Cancelled", () => {
      expect(PROJECT_STATUS_TRANSITIONS["Cancelled"]).toEqual([]);
    });
  });

  describe("TASK_STATUS_TRANSITIONS", () => {
    it("allows Todo to transition to In Progress", () => {
      expect(TASK_STATUS_TRANSITIONS["Todo"]).toEqual(["In Progress"]);
    });

    it("allows In Progress to transition to Review", () => {
      expect(TASK_STATUS_TRANSITIONS["In Progress"]).toEqual(["Review"]);
    });

    it("allows Review to transition to Done or In Progress", () => {
      expect(TASK_STATUS_TRANSITIONS["Review"]).toEqual([
        "Done",
        "In Progress",
      ]);
    });

    it("allows no transitions from Done", () => {
      expect(TASK_STATUS_TRANSITIONS["Done"]).toEqual([]);
    });
  });

  describe("isValidProjectTransition", () => {
    it("returns true for valid transitions", () => {
      expect(isValidProjectTransition("Planned", "In Progress")).toBe(true);
      expect(isValidProjectTransition("In Progress", "Completed")).toBe(true);
      expect(isValidProjectTransition("On Hold", "Cancelled")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(isValidProjectTransition("Planned", "Completed")).toBe(false);
      expect(isValidProjectTransition("Completed", "In Progress")).toBe(false);
      expect(isValidProjectTransition("Cancelled", "Planned")).toBe(false);
    });
  });

  describe("isValidTaskTransition", () => {
    it("returns true for valid transitions", () => {
      expect(isValidTaskTransition("Todo", "In Progress")).toBe(true);
      expect(isValidTaskTransition("In Progress", "Review")).toBe(true);
      expect(isValidTaskTransition("Review", "Done")).toBe(true);
      expect(isValidTaskTransition("Review", "In Progress")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(isValidTaskTransition("Todo", "Done")).toBe(false);
      expect(isValidTaskTransition("Done", "Todo")).toBe(false);
      expect(isValidTaskTransition("In Progress", "Done")).toBe(false);
    });
  });

  describe("getAllowedProjectTransitions", () => {
    it("returns the allowed transitions for a given status", () => {
      expect(getAllowedProjectTransitions("Planned")).toEqual([
        "In Progress",
        "Cancelled",
      ]);
      expect(getAllowedProjectTransitions("Completed")).toEqual([]);
    });
  });

  describe("getAllowedTaskTransitions", () => {
    it("returns the allowed transitions for a given status", () => {
      expect(getAllowedTaskTransitions("Todo")).toEqual(["In Progress"]);
      expect(getAllowedTaskTransitions("Done")).toEqual([]);
    });
  });
});
