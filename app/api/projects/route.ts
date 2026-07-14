import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api-handler";
import { projectService } from "@/services/project.service";
import { createProjectSchema } from "@/validators/project.validator";
import { projectQueryParamsSchema } from "@/validators/common.validator";
import { ValidationError } from "@/lib/errors";

/**
 * GET /api/projects
 * Lists projects with optional search, status/priority filter, and sort.
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());

  // Validate query params
  const parsed = projectQueryParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new ValidationError(
      "Invalid query parameters",
      parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }))
    );
  }

  const projects = await projectService.listProjects(parsed.data);
  return NextResponse.json(projects);
});

/**
 * POST /api/projects
 * Creates a new project after validating the request body.
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body) {
    throw new ValidationError("Request body is invalid or missing");
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      "Validation failed",
      parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }))
    );
  }

  const project = await projectService.createProject(parsed.data);
  return NextResponse.json(project, { status: 201 });
});
