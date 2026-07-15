import { NextResponse } from "next/server";
import { withErrorHandling, RouteContext } from "@/lib/api-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-helpers";
import { canPerformAction } from "@/lib/permissions";
import { taskService } from "@/services/task.service";
import { updateTaskSchema } from "@/validators/task.validator";
import { uuidSchema } from "@/validators/common.validator";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { Role } from "@prisma/client";

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
 * Requires authentication.
 */
export const GET = withErrorHandling(withAuth(async (req: AuthenticatedRequest, ctx: RouteContext) => {
  const id = await validateId(ctx);
  const task = await taskService.getTaskById(id);
  return NextResponse.json(task);
}));

/**
 * PUT /api/tasks/:id
 * Updates an existing task. Validates both the ID and request body.
 * Requires authentication. Enforces ownership check for Members.
 */
export const PUT = withErrorHandling(withAuth(async (req: AuthenticatedRequest, ctx: RouteContext) => {
  const id = await validateId(ctx);

  // Fetch task to check ownership
  const existingTask = await taskService.getTaskById(id);

  // Check permissions
  const allowed = canPerformAction("update", "task", {
    userRole: req.user.role as Role,
    userId: req.user.id,
    resourceOwnerId: existingTask.createdById,
  });
  if (!allowed) {
    throw new ForbiddenError();
  }

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
}));

/**
 * DELETE /api/tasks/:id
 * Deletes a task by ID. Returns the deleted task's ID.
 * Requires authentication. Enforces ownership check for Members.
 */
export const DELETE = withErrorHandling(withAuth(async (req: AuthenticatedRequest, ctx: RouteContext) => {
  const id = await validateId(ctx);

  // Fetch task to check ownership
  const existingTask = await taskService.getTaskById(id);

  // Check permissions
  const allowed = canPerformAction("delete", "task", {
    userRole: req.user.role as Role,
    userId: req.user.id,
    resourceOwnerId: existingTask.createdById,
  });
  if (!allowed) {
    throw new ForbiddenError();
  }

  const result = await taskService.deleteTask(id);
  return NextResponse.json(result);
}));
