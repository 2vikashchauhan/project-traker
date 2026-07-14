import { describe, it, expect } from "vitest";
import {
  uuidSchema,
  listQueryParamsSchema,
  projectQueryParamsSchema,
  taskQueryParamsSchema,
} from "@/validators/common.validator";

describe("uuidSchema", () => {
  it("should accept a valid UUID", () => {
    const result = uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000");
    expect(result.success).toBe(true);
  });

  it("should accept a v4 UUID", () => {
    const result = uuidSchema.safeParse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    expect(result.success).toBe(true);
  });

  it("should reject an invalid UUID", () => {
    const result = uuidSchema.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("should reject an empty string", () => {
    const result = uuidSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("should reject a number", () => {
    const result = uuidSchema.safeParse(123);
    expect(result.success).toBe(false);
  });
});

describe("listQueryParamsSchema", () => {
  it("should accept empty object", () => {
    const result = listQueryParamsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept valid search string", () => {
    const result = listQueryParamsSchema.safeParse({ search: "my project" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("my project");
    }
  });

  it("should trim search string", () => {
    const result = listQueryParamsSchema.safeParse({ search: "  hello  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("hello");
    }
  });

  it("should reject search exceeding 200 characters", () => {
    const result = listQueryParamsSchema.safeParse({ search: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("should accept search of exactly 200 characters", () => {
    const result = listQueryParamsSchema.safeParse({ search: "a".repeat(200) });
    expect(result.success).toBe(true);
  });

  it("should accept sortBy 'dueDate'", () => {
    const result = listQueryParamsSchema.safeParse({ sortBy: "dueDate" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid sortBy value", () => {
    const result = listQueryParamsSchema.safeParse({ sortBy: "name" });
    expect(result.success).toBe(false);
  });

  it("should accept sortOrder 'asc'", () => {
    const result = listQueryParamsSchema.safeParse({ sortOrder: "asc" });
    expect(result.success).toBe(true);
  });

  it("should accept sortOrder 'desc'", () => {
    const result = listQueryParamsSchema.safeParse({ sortOrder: "desc" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid sortOrder", () => {
    const result = listQueryParamsSchema.safeParse({ sortOrder: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should passthrough unknown fields", () => {
    const result = listQueryParamsSchema.safeParse({ unknownField: "value" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty("unknownField", "value");
    }
  });
});

describe("projectQueryParamsSchema", () => {
  it("should accept valid project status (exact case)", () => {
    const result = projectQueryParamsSchema.safeParse({ status: "Planned" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Planned");
    }
  });

  it("should accept project status case-insensitively", () => {
    const result = projectQueryParamsSchema.safeParse({ status: "in progress" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("In Progress");
    }
  });

  it("should accept 'ON HOLD' case-insensitively", () => {
    const result = projectQueryParamsSchema.safeParse({ status: "ON HOLD" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("On Hold");
    }
  });

  it("should reject invalid project status", () => {
    const result = projectQueryParamsSchema.safeParse({ status: "Invalid" });
    expect(result.success).toBe(false);
  });

  it("should accept valid priority (exact case)", () => {
    const result = projectQueryParamsSchema.safeParse({ priority: "High" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("High");
    }
  });

  it("should accept priority case-insensitively", () => {
    const result = projectQueryParamsSchema.safeParse({ priority: "low" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("Low");
    }
  });

  it("should accept MEDIUM priority case-insensitively", () => {
    const result = projectQueryParamsSchema.safeParse({ priority: "MEDIUM" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("Medium");
    }
  });

  it("should reject invalid priority", () => {
    const result = projectQueryParamsSchema.safeParse({ priority: "Urgent" });
    expect(result.success).toBe(false);
  });

  it("should accept all params together", () => {
    const result = projectQueryParamsSchema.safeParse({
      search: "test",
      status: "completed",
      priority: "high",
      sortBy: "dueDate",
      sortOrder: "desc",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("test");
      expect(result.data.status).toBe("Completed");
      expect(result.data.priority).toBe("High");
      expect(result.data.sortBy).toBe("dueDate");
      expect(result.data.sortOrder).toBe("desc");
    }
  });

  it("should passthrough unknown fields from URL params", () => {
    const result = projectQueryParamsSchema.safeParse({ page: "1" });
    expect(result.success).toBe(true);
  });
});

describe("taskQueryParamsSchema", () => {
  it("should accept valid task status (exact case)", () => {
    const result = taskQueryParamsSchema.safeParse({ status: "Todo" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Todo");
    }
  });

  it("should accept task status case-insensitively", () => {
    const result = taskQueryParamsSchema.safeParse({ status: "in progress" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("In Progress");
    }
  });

  it("should accept 'review' case-insensitively", () => {
    const result = taskQueryParamsSchema.safeParse({ status: "REVIEW" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Review");
    }
  });

  it("should accept 'done' case-insensitively", () => {
    const result = taskQueryParamsSchema.safeParse({ status: "done" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Done");
    }
  });

  it("should reject invalid task status", () => {
    const result = taskQueryParamsSchema.safeParse({ status: "Planned" });
    expect(result.success).toBe(false);
  });

  it("should accept valid priority case-insensitively", () => {
    const result = taskQueryParamsSchema.safeParse({ priority: "high" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("High");
    }
  });

  it("should reject invalid priority", () => {
    const result = taskQueryParamsSchema.safeParse({ priority: "Critical" });
    expect(result.success).toBe(false);
  });

  it("should reject project-specific status values", () => {
    const result = taskQueryParamsSchema.safeParse({ status: "On Hold" });
    expect(result.success).toBe(false);
  });

  it("should accept all params together", () => {
    const result = taskQueryParamsSchema.safeParse({
      search: "fix bug",
      status: "todo",
      priority: "medium",
      sortBy: "dueDate",
      sortOrder: "asc",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("fix bug");
      expect(result.data.status).toBe("Todo");
      expect(result.data.priority).toBe("Medium");
      expect(result.data.sortBy).toBe("dueDate");
      expect(result.data.sortOrder).toBe("asc");
    }
  });
});
