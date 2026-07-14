import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  updateTaskSchema,
} from "@/validators/task.validator";

describe("createTaskSchema", () => {
  const validInput = {
    title: "Implement feature",
    priority: "High" as const,
    projectId: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("should accept valid minimal input", () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Implement feature");
      expect(result.data.priority).toBe("High");
      expect(result.data.projectId).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("should accept all fields", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      description: "Some task description",
      status: "In Progress",
      dueDate: "2024-12-31T00:00:00.000Z",
      assignedTo: "John Doe",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Some task description");
      expect(result.data.status).toBe("In Progress");
      expect(result.data.dueDate).toBe("2024-12-31T00:00:00.000Z");
      expect(result.data.assignedTo).toBe("John Doe");
    }
  });

  it("should default status to Todo when not provided", () => {
    const result = createTaskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Todo");
    }
  });

  it("should trim title whitespace", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      title: "  Trimmed title  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Trimmed title");
    }
  });

  it("should reject empty title", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject whitespace-only title", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("should reject title exceeding 150 characters", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      title: "a".repeat(151),
    });
    expect(result.success).toBe(false);
  });

  it("should accept title of exactly 150 characters", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      title: "a".repeat(150),
    });
    expect(result.success).toBe(true);
  });

  it("should reject description exceeding 1000 characters", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      description: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("should accept description of exactly 1000 characters", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      description: "a".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty description", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing priority", () => {
    const { priority, ...noPriority } = validInput;
    const result = createTaskSchema.safeParse(noPriority);
    expect(result.success).toBe(false);
  });

  it("should reject invalid priority value", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      priority: "Urgent",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid priority values", () => {
    for (const priority of ["Low", "Medium", "High"]) {
      const result = createTaskSchema.safeParse({ ...validInput, priority });
      expect(result.success).toBe(true);
    }
  });

  it("should reject missing projectId", () => {
    const { projectId, ...noProjectId } = validInput;
    const result = createTaskSchema.safeParse(noProjectId);
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID for projectId", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      projectId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid task statuses", () => {
    for (const status of ["Todo", "In Progress", "Review", "Done"]) {
      const result = createTaskSchema.safeParse({ ...validInput, status });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid status value", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      status: "Planned",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid dueDate format", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      dueDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid ISO date string for dueDate", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      dueDate: "2024-06-15T10:30:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("should accept assignedTo as a string", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      assignedTo: "Alice",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignedTo).toBe("Alice");
    }
  });

  it("should accept assignedTo as null", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      assignedTo: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignedTo).toBeNull();
    }
  });

  it("should reject assignedTo exceeding 100 characters", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      assignedTo: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should accept assignedTo of exactly 100 characters", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      assignedTo: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("should reject assignedTo as empty string", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      assignedTo: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject unknown fields (strict mode)", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      unknownField: "value",
    });
    expect(result.success).toBe(false);
  });

  it("should reject multiple unknown fields", () => {
    const result = createTaskSchema.safeParse({
      ...validInput,
      extra1: "a",
      extra2: "b",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("should accept empty object (all fields optional)", () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept valid title update", () => {
    const result = updateTaskSchema.safeParse({ title: "Updated title" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Updated title");
    }
  });

  it("should trim title on update", () => {
    const result = updateTaskSchema.safeParse({ title: "  spaces  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("spaces");
    }
  });

  it("should reject empty title on update", () => {
    const result = updateTaskSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("should reject whitespace-only title on update", () => {
    const result = updateTaskSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
  });

  it("should reject title exceeding 150 chars on update", () => {
    const result = updateTaskSchema.safeParse({ title: "a".repeat(151) });
    expect(result.success).toBe(false);
  });

  it("should accept valid description update", () => {
    const result = updateTaskSchema.safeParse({
      description: "New description",
    });
    expect(result.success).toBe(true);
  });

  it("should reject description exceeding 1000 chars on update", () => {
    const result = updateTaskSchema.safeParse({
      description: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid priority update", () => {
    const result = updateTaskSchema.safeParse({ priority: "Low" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid priority on update", () => {
    const result = updateTaskSchema.safeParse({ priority: "Critical" });
    expect(result.success).toBe(false);
  });

  it("should accept valid projectId update", () => {
    const result = updateTaskSchema.safeParse({
      projectId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid projectId on update", () => {
    const result = updateTaskSchema.safeParse({ projectId: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should accept valid status update", () => {
    const result = updateTaskSchema.safeParse({ status: "Done" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid status on update", () => {
    const result = updateTaskSchema.safeParse({ status: "Completed" });
    expect(result.success).toBe(false);
  });

  it("should accept valid dueDate update", () => {
    const result = updateTaskSchema.safeParse({
      dueDate: "2025-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid dueDate on update", () => {
    const result = updateTaskSchema.safeParse({ dueDate: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should accept assignedTo as string on update", () => {
    const result = updateTaskSchema.safeParse({ assignedTo: "Bob" });
    expect(result.success).toBe(true);
  });

  it("should accept assignedTo as null on update (unassign)", () => {
    const result = updateTaskSchema.safeParse({ assignedTo: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignedTo).toBeNull();
    }
  });

  it("should reject assignedTo exceeding 100 chars on update", () => {
    const result = updateTaskSchema.safeParse({
      assignedTo: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should reject unknown fields on update (strict mode)", () => {
    const result = updateTaskSchema.safeParse({
      title: "valid",
      unknownField: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("should accept multiple valid fields at once", () => {
    const result = updateTaskSchema.safeParse({
      title: "Updated",
      priority: "Medium",
      status: "Review",
      assignedTo: "Charlie",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Updated");
      expect(result.data.priority).toBe("Medium");
      expect(result.data.status).toBe("Review");
      expect(result.data.assignedTo).toBe("Charlie");
    }
  });
});
