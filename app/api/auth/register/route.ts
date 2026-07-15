import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api-handler";
import { authService } from "@/services/auth.service";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const user = await authService.register(body);
  return NextResponse.json(user, { status: 201 });
});
