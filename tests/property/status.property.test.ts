import fc from "fast-check";
import { describe, it, expect } from "vitest";
import {
  PROJECT_STATUSES,
  TASK_STATUSES,
} from "@/types/common.types";
import type { ProjectStatus, TaskStatus } from "@/types/common.types";
import {
  isValidProjectTransition,
  isValidTaskTransition,
  PROJECT_STATUS_TRANSITIONS,
  TASK_STATUS_TRANSITIONS,
} from "@/utils/status-transitions";

// --- Property 5: Project Status Transition Enforcement ---

describe("Property 5: Project Status Transition Enforcement", () => {
  // Feature: project-tracker, Property 5: Project Status Transition Enforcement
  /**
   * Validates: Requirements 6.1, 6.2, 6.3
   *
   * For any project with a current status and any attempted new status,
   * the system SHALL accept the transition if and only if (currentStatus, newStatus)
   * is in the allowed transitions map.
   */

  const projectStatusArb = fc.constantFrom(...PROJECT_STATUSES);

  it("accepts a transition if and only if it is in the allowed transitions map", () => {
    fc.assert(
      fc.property(projectStatusArb, projectStatusArb, (current, next) => {
        const allowed = PROJECT_STATUS_TRANSITIONS[current];
        const isInMap = allowed.includes(next);
        const result = isValidProjectTransition(current, next);

        expect(result).toBe(isInMap);
      }),
      { numRuns: 200 }
    );
  });

  it("rejects all transitions from terminal statuses (Completed, Cancelled)", () => {
    const terminalStatuses: ProjectStatus[] = ["Completed", "Cancelled"];
    const terminalStatusArb = fc.constantFrom(...terminalStatuses);

    fc.assert(
      fc.property(terminalStatusArb, projectStatusArb, (current, next) => {
        const result = isValidProjectTransition(current, next);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("allows only the exact transitions defined in the map for each status", () => {
    fc.assert(
      fc.property(projectStatusArb, (current) => {
        const allowedNextStatuses = PROJECT_STATUS_TRANSITIONS[current];

        // Every status in allowed list must be accepted
        for (const next of allowedNextStatuses) {
          expect(isValidProjectTransition(current, next)).toBe(true);
        }

        // Every status NOT in allowed list must be rejected
        const disallowed = PROJECT_STATUSES.filter(
          (s) => !allowedNextStatuses.includes(s)
        );
        for (const next of disallowed) {
          expect(isValidProjectTransition(current, next)).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("validates specific allowed transitions from design: Planned → In Progress, Planned → Cancelled", () => {
    expect(isValidProjectTransition("Planned", "In Progress")).toBe(true);
    expect(isValidProjectTransition("Planned", "Cancelled")).toBe(true);
    expect(isValidProjectTransition("Planned", "Completed")).toBe(false);
    expect(isValidProjectTransition("Planned", "On Hold")).toBe(false);
  });

  it("validates specific allowed transitions: In Progress → Completed, On Hold, Cancelled", () => {
    expect(isValidProjectTransition("In Progress", "Completed")).toBe(true);
    expect(isValidProjectTransition("In Progress", "On Hold")).toBe(true);
    expect(isValidProjectTransition("In Progress", "Cancelled")).toBe(true);
    expect(isValidProjectTransition("In Progress", "Planned")).toBe(false);
  });

  it("validates specific allowed transitions: On Hold → In Progress, Cancelled", () => {
    expect(isValidProjectTransition("On Hold", "In Progress")).toBe(true);
    expect(isValidProjectTransition("On Hold", "Cancelled")).toBe(true);
    expect(isValidProjectTransition("On Hold", "Completed")).toBe(false);
    expect(isValidProjectTransition("On Hold", "Planned")).toBe(false);
  });
});

// --- Property 6: Task Status Transition Enforcement ---

describe("Property 6: Task Status Transition Enforcement", () => {
  // Feature: project-tracker, Property 6: Task Status Transition Enforcement
  /**
   * Validates: Requirements 11.1, 11.2, 11.4, 11.5
   *
   * For any task with a current status and any attempted new status,
   * the system SHALL accept the transition if and only if (currentStatus, newStatus)
   * is in the allowed transitions map.
   */

  const taskStatusArb = fc.constantFrom(...TASK_STATUSES);

  it("accepts a transition if and only if it is in the allowed transitions map", () => {
    fc.assert(
      fc.property(taskStatusArb, taskStatusArb, (current, next) => {
        const allowed = TASK_STATUS_TRANSITIONS[current];
        const isInMap = allowed.includes(next);
        const result = isValidTaskTransition(current, next);

        expect(result).toBe(isInMap);
      }),
      { numRuns: 200 }
    );
  });

  it("rejects all transitions from terminal status (Done)", () => {
    fc.assert(
      fc.property(taskStatusArb, (next) => {
        const result = isValidTaskTransition("Done", next);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("allows only the exact transitions defined in the map for each status", () => {
    fc.assert(
      fc.property(taskStatusArb, (current) => {
        const allowedNextStatuses = TASK_STATUS_TRANSITIONS[current];

        // Every status in allowed list must be accepted
        for (const next of allowedNextStatuses) {
          expect(isValidTaskTransition(current, next)).toBe(true);
        }

        // Every status NOT in allowed list must be rejected
        const disallowed = TASK_STATUSES.filter(
          (s) => !allowedNextStatuses.includes(s)
        );
        for (const next of disallowed) {
          expect(isValidTaskTransition(current, next)).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("validates specific allowed transitions: Todo → In Progress only", () => {
    expect(isValidTaskTransition("Todo", "In Progress")).toBe(true);
    expect(isValidTaskTransition("Todo", "Review")).toBe(false);
    expect(isValidTaskTransition("Todo", "Done")).toBe(false);
  });

  it("validates specific allowed transitions: In Progress → Review only", () => {
    expect(isValidTaskTransition("In Progress", "Review")).toBe(true);
    expect(isValidTaskTransition("In Progress", "Done")).toBe(false);
    expect(isValidTaskTransition("In Progress", "Todo")).toBe(false);
  });

  it("validates specific allowed transitions: Review → Done, In Progress", () => {
    expect(isValidTaskTransition("Review", "Done")).toBe(true);
    expect(isValidTaskTransition("Review", "In Progress")).toBe(true);
    expect(isValidTaskTransition("Review", "Todo")).toBe(false);
  });

  it("validates that task status values are restricted to Todo, In Progress, Review, Done", () => {
    expect(TASK_STATUSES).toEqual(["Todo", "In Progress", "Review", "Done"]);
    expect(TASK_STATUSES.length).toBe(4);
  });

  it("validates that project status values are restricted to Planned, In Progress, Completed, On Hold, Cancelled", () => {
    expect(PROJECT_STATUSES).toEqual([
      "Planned",
      "In Progress",
      "Completed",
      "On Hold",
      "Cancelled",
    ]);
    expect(PROJECT_STATUSES.length).toBe(5);
  });
});
