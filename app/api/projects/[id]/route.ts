import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling, RouteContext } from "@/lib/api-handler";
import { projectService } from "@/services/project.service";
import { updateProjectSchema } from "@/validators/project.validator";
import { uuidSchema } from "@/validators/common.validator";
import { ValidationError } from "@/lib/errors";

/**
 * GET /api/projects/:id
 * Retrieves a single project with its associated tasks.
 */
export const GET = withErrorHandling(async (req: NextRequest, ctx: RouteContext) => {
  const id = ctx.params.id as string;

  const uuidResult = uuidSchema.safeParse(id);
  if (!uuidResult.success) {
    throw new ValidationError("Invalid identifier format", [
      { field: "id", message: "Identifier is malformed" },
    ]);
  }

  const project = await projectService.getProjectById(id);
  return NextResponse.json(project);
});

/**
 * PUT /api/projects/:id
 * Updates an existing project after validating the request body.
 */
export const PUT = withErrorHandling(async (req: NextRequest, ctx: RouteContext) => {
  const id = ctx.params.id as string;

  const uuidResult = uuidSchema.safeParse(id);
  if (!uuidResult.success) {
    throw new ValidationError("Invalid identifier format", [
      { field: "id", message: "Identifier is malformed" },
    ]);
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
});

/**
 * DELETE /api/projects/:id
 * Deletes a project and all associated tasks (cascade).
 */
export const DELETE = withErrorHandling(async (req: NextRequest, ctx: RouteContext) => {
  const id = ctx.params.id as string;

  const uuidResult = uuidSchema.safeParse(id);
  if (!uuidResult.success) {
    throw new ValidationError("Invalid identifier format", [
      { field: "id", message: "Identifier is malformed" },
    ]);
  }

  const result = await projectService.deleteProject(id);
  return NextResponse.json(result);
});
