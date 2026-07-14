import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling, RouteContext } from "@/lib/api-handler";
import { taskService } from "@/services/task.service";
import { updateTaskSchema } from "@/validators/task.validator";
import { uuidSchema } from "@/validators/common.validator";
import { ValidationError } from "@/lib/errors";

/**
 * Validates and extracts the task ID from route params.
 * Throws ValidationError if the ID is not a valid UUID.
 */
async function validateId(ctx: RouteContext): Promise<string> {
  const params = await (ctx.params as unknown as Promise<{ id: string }>);
  const id = params.id;
  const result = uuidSchema.safeParse(id);
  if (!result.success) {
    throw new ValidationError("Invalid task identifier format");
  }
  return result.data;
}

/**
 * GET /api/tasks/:id
 * Retrieves a single task by ID.
 */
export const GET = withErrorHandling(async (req: NextRequest, ctx: RouteContext) => {
  const id = await validateId(ctx);
  const task = await taskService.getTaskById(id);
  return NextResponse.json(task);
});

/**
 * PUT /api/tasks/:id
 * Updates an existing task. Validates both the ID and request body.
 */
export const PUT = withErrorHandling(async (req: NextRequest, ctx: RouteContext) => {
  const id = await validateId(ctx);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Request body is invalid or missing");
  }

  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body is invalid or missing");
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    throw new ValidationError("Validation failed", fieldErrors);
  }

  const task = await taskService.updateTask(id, parsed.data);
  return NextResponse.json(task);
});

/**
 * DELETE /api/tasks/:id
 * Deletes a task by ID. Returns the deleted task's ID.
 */
export const DELETE = withErrorHandling(async (req: NextRequest, ctx: RouteContext) => {
  const id = await validateId(ctx);
  const result = await taskService.deleteTask(id);
  return NextResponse.json(result);
});
