import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  AppError,
  ValidationError,
  TransitionError,
} from "@/lib/errors";

export interface RouteContext {
  params: Record<string, string | string[]>;
}

/**
 * Wraps a Next.js route handler with centralized error handling.
 * Maps AppError subclasses and Prisma errors to consistent HTTP responses.
 */
export function withErrorHandling(
  handler: (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: RouteContext): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      // Handle known application errors
      if (error instanceof AppError) {
        const body: Record<string, unknown> = {
          error: error.errorType,
          message: error.message,
        };

        if (error instanceof ValidationError) {
          body.fieldErrors = error.fieldErrors;
        }

        if (error instanceof TransitionError) {
          body.currentStatus = error.currentStatus;
          body.attemptedStatus = error.attemptedStatus;
          body.allowedTransitions = error.allowedTransitions;
        }

        return NextResponse.json(body, { status: error.statusCode });
      }

      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return NextResponse.json(
            { error: "ConflictError", message: "Resource already exists" },
            { status: 409 }
          );
        }
        if (error.code === "P2025") {
          return NextResponse.json(
            { error: "NotFoundError", message: "Resource not found" },
            { status: 404 }
          );
        }
      }

      // Generic 500 — never expose internals
      console.error("Unhandled error:", error);
      return NextResponse.json(
        { error: "InternalError", message: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  };
}
