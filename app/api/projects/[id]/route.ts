import { NextResponse } from "next/server";
import { withErrorHandling, RouteContext } from "@/lib/api-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-helpers";
import { canPerformAction } from "@/lib/permissions";
import { projectService } from "@/services/project.service";
import { updateProjectSchema } from "@/validators/project.validator";
import { uuidSchema } from "@/validators/common.validator";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { Role } from "@prisma/client";

/**
 * GET /api/projects/:id
 * Retrieves a single project with its associated tasks.
 * Requires authentication (all authenticated users can read).
 */
export const GET = withErrorHandling(withAuth(async (req: AuthenticatedRequest, ctx: RouteContext) => {
  const id = ctx.params.id as string;

  const uuidResult = uuidSchema.safeParse(id);
  if (!uuidResult.success) {
    throw new ValidationError("Invalid identifier format", [
      { field: "id", message: "Identifier is malformed" },
    ]);
  }

  const project = await projectService.getProjectById(id);
  return NextResponse.json(project);
}));

/**
 * PUT /api/projects/:id
 * Updates an existing project after validating the request body.
 * Requires authentication and ownership/role check.
 */
export const PUT = withErrorHandling(withAuth(async (req: AuthenticatedRequest, ctx: RouteContext) => {
  const id = ctx.params.id as string;

  const uuidResult = uuidSchema.safeParse(id);
  if (!uuidResult.success) {
    throw new ValidationError("Invalid identifier format", [
      { field: "id", message: "Identifier is malformed" },
    ]);
  }

  // Fetch the project to check ownership
  const existing = await projectService.getProjectById(id);

  // Check permission
  const allowed = canPerformAction("update", "project", {
    userRole: req.user.role as Role,
    userId: req.user.id,
    resourceOwnerId: existing.ownerId,
  });
  if (!allowed) {
    throw new ForbiddenError("You do not have permission to update this project");
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    throw new ValidationError("Request body is invalid or missing");
  }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      "Validation failed",
      parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }))
    );
  }

  const project = await projectService.updateProject(id, parsed.data);
  return NextResponse.json(project);
}));

/**
 * DELETE /api/projects/:id
 * Deletes a project and all associated tasks (cascade).
 * Requires authentication and ownership/role check.
 */
export const DELETE = withErrorHandling(withAuth(async (req: AuthenticatedRequest, ctx: RouteContext) => {
  const id = ctx.params.id as string;

  const uuidResult = uuidSchema.safeParse(id);
  if (!uuidResult.success) {
    throw new ValidationError("Invalid identifier format", [
      { field: "id", message: "Identifier is malformed" },
    ]);
  }

  // Fetch the project to check ownership
  const existing = await projectService.getProjectById(id);

  // Check permission
  const allowed = canPerformAction("delete", "project", {
    userRole: req.user.role as Role,
    userId: req.user.id,
    resourceOwnerId: existing.ownerId,
  });
  if (!allowed) {
    throw new ForbiddenError("You do not have permission to delete this project");
  }

  const result = await projectService.deleteProject(id);
  return NextResponse.json(result);
}));
