import { NextResponse } from "next/server";
import { withErrorHandling, RouteContext } from "@/lib/api-handler";
import { withAuth, withRole, AuthenticatedRequest } from "@/lib/auth-helpers";
import { userService } from "@/services/user.service";

/**
 * GET /api/admin/users
 * Admin-only endpoint that returns a list of all users.
 * Requires Admin role — returns 403 for non-Admin users.
 */
export const GET = withErrorHandling(
  withAuth(
    withRole("Admin")(async (req: AuthenticatedRequest, ctx: RouteContext) => {
      const users = await userService.listUsers();
      return NextResponse.json(users);
    })
  )
);
