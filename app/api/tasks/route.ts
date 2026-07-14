import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api-handler";
import { taskService } from "@/services/task.service";
import { createTaskSchema } from "@/validators/task.validator";
import { taskQueryParamsSchema } from "@/validators/common.validator";
import { ValidationError } from "@/lib/errors";

/**
 * GET /api/tasks
 * Lists tasks with optional search, status filter, priority filter, and sort.
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const rawParams: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  const parsed = taskQueryParamsSchema.safeParse(rawParams);
  if (!parsed.success) {
    const fieldErrors = parsed.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    throw new ValidationError("Invalid query parameters", fieldErrors);
  }

  const tasks = await taskService.listTasks(parsed.data);
  return NextResponse.json(tasks);
});

/**
 * POST /api/tasks
 * Creates a new task. Returns 201 on success.
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Request body is invalid or missing");
  }

  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body is invalid or missing");
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    throw new ValidationError("Validation failed", fieldErrors);
  }

  const task = await taskService.createTask(parsed.data);
  return NextResponse.json(task, { status: 201 });
});
