import { NextResponse } from "next/server";
import { withErrorHandling, RouteContext } from "@/lib/api-handler";
import { withAuth, withRole, AuthenticatedRequest } from "@/lib/auth-helpers";
import { userService } from "@/services/user.service";
import { changeRoleSchema } from "@/validators/auth.validator";
import { ValidationError } from "@/lib/errors";

/**
 * PATCH /api/admin/users/[id]
 * Admin-only endpoint that changes a user's role.
 * Requires Admin role — returns 403 for non-Admin users or self-role-change.
 * Returns 404 if target user is not found.
 */
export const PATCH = withErrorHandling(
  withAuth(
    withRole("Admin")(async (req: AuthenticatedRequest, ctx: RouteContext) => {
      const params = await (ctx.params as unknown as Promise<{ id: string }>);
      const { id } = params;

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        throw new ValidationError("Request body is invalid or missing");
      }

      const parsed = changeRoleSchema.safeParse(body);
      if (!parsed.success) {
        const fieldErrors = parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", fieldErrors);
      }

      const updated = await userService.changeRole(req.user.id, id, parsed.data.role);
      return NextResponse.json(updated);
    })
  )
);
