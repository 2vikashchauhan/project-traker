import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-helpers";
import { dashboardService } from "@/services/dashboard.service";

export const GET = withErrorHandling(
  withAuth(async (req: AuthenticatedRequest) => {
    const stats = await dashboardService.getDashboardStats();
    return NextResponse.json(stats);
  })
);
