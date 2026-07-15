import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { RouteContext } from "@/lib/api-handler";

export interface AuthenticatedRequest extends NextRequest {
  user: { id: string; email: string; name: string; role: string };
}

/**
 * Wraps a route handler to require authentication.
 * Injects user context from the JWT session.
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, ctx: RouteContext) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: RouteContext): Promise<NextResponse> => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    (req as AuthenticatedRequest).user = session.user as AuthenticatedRequest["user"];
    return handler(req as AuthenticatedRequest, ctx);
  };
}

/**
 * Wraps a route handler to require a specific role (or set of roles).
 * Must be used after withAuth.
 */
export function withRole(...roles: string[]) {
  return (
    handler: (req: AuthenticatedRequest, ctx: RouteContext) => Promise<NextResponse>
  ) => {
    return async (req: AuthenticatedRequest, ctx: RouteContext): Promise<NextResponse> => {
      if (!roles.includes(req.user.role)) {
        return NextResponse.json(
          { error: "Forbidden", message: "Insufficient permissions" },
          { status: 403 }
        );
      }
      return handler(req, ctx);
    };
  };
}
