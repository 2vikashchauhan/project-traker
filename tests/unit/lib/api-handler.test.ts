import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling, RouteContext } from "@/lib/api-handler";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  TransitionError,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/errors";
import { Prisma } from "@prisma/client";

function createMockRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/test");
}

function createMockContext(): RouteContext {
  return { params: {} };
}

describe("lib/api-handler - withErrorHandling", () => {
  it("should pass through successful responses", async () => {
    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ data: "success" }, { status: 200 })
    );
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: "success" });
  });

  it("should handle ValidationError with fieldErrors (400)", async () => {
    const handler = vi.fn().mockRejectedValue(
      new ValidationError("Invalid input", [
        { field: "name", message: "Name is required" },
        { field: "priority", message: "Priority must be Low, Medium, or High" },
      ])
    );
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("ValidationError");
    expect(body.message).toBe("Invalid input");
    expect(body.fieldErrors).toEqual([
      { field: "name", message: "Name is required" },
      { field: "priority", message: "Priority must be Low, Medium, or High" },
    ]);
  });

  it("should handle NotFoundError (404)", async () => {
    const handler = vi.fn().mockRejectedValue(
      new NotFoundError("Project", "abc-123")
    );
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("NotFoundError");
    expect(body.message).toBe("Project with identifier 'abc-123' was not found");
  });

  it("should handle ConflictError (409)", async () => {
    const handler = vi.fn().mockRejectedValue(
      new ConflictError("Resource already exists")
    );
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("ConflictError");
    expect(body.message).toBe("Resource already exists");
  });

  it("should handle TransitionError with status details (400)", async () => {
    const handler = vi.fn().mockRejectedValue(
      new TransitionError("Planned", "Completed", ["In Progress", "Cancelled"])
    );
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("TransitionError");
    expect(body.message).toContain("Cannot transition from 'Planned' to 'Completed'");
    expect(body.currentStatus).toBe("Planned");
    expect(body.attemptedStatus).toBe("Completed");
    expect(body.allowedTransitions).toEqual(["In Progress", "Cancelled"]);
  });

  it("should handle UnauthorizedError (401)", async () => {
    const handler = vi.fn().mockRejectedValue(new UnauthorizedError());
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("UnauthorizedError");
    expect(body.message).toBe("Authentication required");
  });

  it("should handle UnauthorizedError with custom message (401)", async () => {
    const handler = vi.fn().mockRejectedValue(
      new UnauthorizedError("Token expired")
    );
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("UnauthorizedError");
    expect(body.message).toBe("Token expired");
  });

  it("should handle ForbiddenError (403)", async () => {
    const handler = vi.fn().mockRejectedValue(new ForbiddenError());
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("ForbiddenError");
    expect(body.message).toBe(
      "You do not have permission to perform this action"
    );
  });

  it("should handle ForbiddenError with custom message (403)", async () => {
    const handler = vi.fn().mockRejectedValue(
      new ForbiddenError("Admin access required")
    );
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("ForbiddenError");
    expect(body.message).toBe("Admin access required");
  });

  it("should handle PrismaClientKnownRequestError P2002 as 409 Conflict", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "6.2.1" }
    );
    const handler = vi.fn().mockRejectedValue(prismaError);
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("ConflictError");
    expect(body.message).toBe("Resource already exists");
  });

  it("should handle PrismaClientKnownRequestError P2025 as 404 Not Found", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Record not found",
      { code: "P2025", clientVersion: "6.2.1" }
    );
    const handler = vi.fn().mockRejectedValue(prismaError);
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("NotFoundError");
    expect(body.message).toBe("Resource not found");
  });

  it("should handle unhandled errors as 500 Internal Error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn().mockRejectedValue(new Error("Something broke"));
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("InternalError");
    expect(body.message).toBe("An unexpected error occurred");
    // Should not expose internal error details
    expect(body.message).not.toContain("Something broke");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should handle non-Error thrown values as 500", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn().mockRejectedValue("string error");
    const wrapped = withErrorHandling(handler);

    const response = await wrapped(createMockRequest(), createMockContext());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("InternalError");
    expect(body.message).toBe("An unexpected error occurred");

    consoleErrorSpy.mockRestore();
  });

  it("should pass request and context to the handler", async () => {
    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ ok: true })
    );
    const wrapped = withErrorHandling(handler);

    const req = createMockRequest();
    const ctx: RouteContext = { params: { id: "test-id" } };
    await wrapped(req, ctx);

    expect(handler).toHaveBeenCalledWith(req, ctx);
  });
});
