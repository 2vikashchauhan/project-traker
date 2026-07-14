import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api-handler";
import { dashboardService } from "@/services/dashboard.service";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const stats = await dashboardService.getDashboardStats();
  return NextResponse.json(stats);
});
