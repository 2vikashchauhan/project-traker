import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/validators/project.validator";

describe("createProjectSchema", () => {
  describe("valid inputs", () => {
    it("should accept a minimal valid project", () => {
      const result = createProjectSchema.safeParse({
        name: "My Project",
        priority: "High",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("My Project");
        expect(result.data.priority).toBe("High");
        expect(result.data.status).toBe("Planned");
      }
    });

    it("should accept a fully populated project", () => {
      const result = createProjectSchema.safeParse({
        name: "Full Project",
        description: "A detailed description",
        priority: "Medium",
        status: "In Progress",
        startDate: "2024-01-01",
        dueDate: "2024-12-31",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Full Project");
        expect(result.data.description).toBe("A detailed description");
        expect(result.data.priority).toBe("Medium");
        expect(result.data.status).toBe("In Progress");
        expect(result.data.startDate).toBe("2024-01-01");
        expect(result.data.dueDate).toBe("2024-12-31");
      }
    });

    it("should trim name whitespace", () => {
      const result = createProjectSchema.safeParse({
        name: "  Trimmed Name  ",
        priority: "Low",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Trimmed Name");
      }
    });

    it("should trim description whitespace", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        description: "  Some description  ",
        priority: "High",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Some description");
      }
    });

    it("should default status to Planned when not provided", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        priority: "Low",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("Planned");
      }
    });

    it("should accept priority case-insensitively", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        priority: "high",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("High");
      }
    });

    it("should accept status case-insensitively", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        priority: "Medium",
        status: "in progress",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("In Progress");
      }
    });

    it("should accept dueDate equal to startDate", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        priority: "High",
        startDate: "2024-06-15",
        dueDate: "2024-06-15",
      });
      expect(result.success).toBe(true);
    });

    it("should accept name of exactly 1 character", () => {
      const result = createProjectSchema.safeParse({
        name: "A",
        priority: "Low",
      });
      expect(result.success).toBe(true);
    });

    it("should accept name of exactly 100 characters", () => {
      const result = createProjectSchema.safeParse({
        name: "A".repeat(100),
        priority: "Low",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("should reject missing name", () => {
      const result = createProjectSchema.safeParse({
        priority: "High",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name after trim", () => {
      const result = createProjectSchema.safeParse({
        name: "   ",
        priority: "High",
      });
      expect(result.success).toBe(false);
    });

    it("should reject name exceeding 100 characters", () => {
      const result = createProjectSchema.safeParse({
        name: "A".repeat(101),
        priority: "High",
      });
      expect(result.success).toBe(false);
    });

    it("should reject description exceeding 500 characters", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        description: "A".repeat(501),
        priority: "High",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing priority", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid priority value", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        priority: "Critical",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid status value", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        priority: "High",
        status: "Active",
      });
      expect(result.success).toBe(false);
    });

    it("should reject dueDate earlier than startDate", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        priority: "High",
        startDate: "2024-06-15",
        dueDate: "2024-06-14",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const dueDateError = result.error.issues.find(
          (issue) => issue.path.includes("dueDate")
        );
        expect(dueDateError).toBeDefined();
        expect(dueDateError?.message).toContain("greater than or equal");
      }
    });

    it("should reject invalid date strings", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        priority: "High",
        startDate: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("should reject unknown fields (strict mode)", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        priority: "High",
        unknownField: "value",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("updateProjectSchema", () => {
  describe("valid inputs", () => {
    it("should accept an empty object (no fields to update)", () => {
      const result = updateProjectSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept partial update with only name", () => {
      const result = updateProjectSchema.safeParse({
        name: "Updated Name",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
      }
    });

    it("should accept partial update with only priority", () => {
      const result = updateProjectSchema.safeParse({
        priority: "Low",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("Low");
      }
    });

    it("should accept partial update with only status", () => {
      const result = updateProjectSchema.safeParse({
        status: "Completed",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("Completed");
      }
    });

    it("should accept all fields together", () => {
      const result = updateProjectSchema.safeParse({
        name: "New Name",
        description: "New description",
        priority: "High",
        status: "On Hold",
        startDate: "2024-01-01",
        dueDate: "2024-12-31",
      });
      expect(result.success).toBe(true);
    });

    it("should trim name on update", () => {
      const result = updateProjectSchema.safeParse({
        name: "  Trimmed  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Trimmed");
      }
    });
  });

  describe("invalid inputs", () => {
    it("should reject empty name after trim", () => {
      const result = updateProjectSchema.safeParse({
        name: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("should reject name exceeding 100 characters", () => {
      const result = updateProjectSchema.safeParse({
        name: "A".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("should reject description exceeding 500 characters", () => {
      const result = updateProjectSchema.safeParse({
        description: "A".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid priority", () => {
      const result = updateProjectSchema.safeParse({
        priority: "Urgent",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const result = updateProjectSchema.safeParse({
        status: "Unknown",
      });
      expect(result.success).toBe(false);
    });

    it("should reject dueDate earlier than startDate", () => {
      const result = updateProjectSchema.safeParse({
        startDate: "2024-06-15",
        dueDate: "2024-06-14",
      });
      expect(result.success).toBe(false);
    });

    it("should reject unknown fields (strict mode)", () => {
      const result = updateProjectSchema.safeParse({
        name: "Valid",
        extraField: "not allowed",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid date format", () => {
      const result = updateProjectSchema.safeParse({
        dueDate: "invalid-date",
      });
      expect(result.success).toBe(false);
    });
  });
});
