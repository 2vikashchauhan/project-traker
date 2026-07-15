import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-helpers";
import { userService } from "@/services/user.service";

/**
 * GET /api/users/me
 * Returns the authenticated user's profile (id, email, name, role).
 * Requires: authenticated session.
 */
export const GET = withErrorHandling(
  withAuth(async (req: AuthenticatedRequest) => {
    const profile = await userService.getProfile(req.user.id);
    return NextResponse.json(profile);
  })
);

/**
 * PATCH /api/users/me
 * Updates the authenticated user's name.
 * The updateProfileSchema (strict mode) rejects email/role fields in the body.
 * Requires: authenticated session.
 */
export const PATCH = withErrorHandling(
  withAuth(async (req: AuthenticatedRequest) => {
    const body = await req.json();
    const updated = await userService.updateProfile(req.user.id, body);
    return NextResponse.json(updated);
  })
);
