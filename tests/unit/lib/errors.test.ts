import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  TransitionError,
} from "@/lib/errors";

describe("lib/errors", () => {
  describe("ValidationError", () => {
    it("should have statusCode 400 and correct errorType", () => {
      const error = new ValidationError("Invalid input", [
        { field: "name", message: "Name is required" },
      ]);
      expect(error.statusCode).toBe(400);
      expect(error.errorType).toBe("ValidationError");
      expect(error.message).toBe("Invalid input");
      expect(error.fieldErrors).toEqual([
        { field: "name", message: "Name is required" },
      ]);
    });

    it("should default fieldErrors to empty array", () => {
      const error = new ValidationError("Invalid input");
      expect(error.fieldErrors).toEqual([]);
    });

    it("should be an instance of AppError and Error", () => {
      const error = new ValidationError("test");
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("NotFoundError", () => {
    it("should have statusCode 404 and correct errorType", () => {
      const error = new NotFoundError("Project", "abc-123");
      expect(error.statusCode).toBe(404);
      expect(error.errorType).toBe("NotFoundError");
      expect(error.resourceType).toBe("Project");
      expect(error.message).toBe(
        "Project with identifier 'abc-123' was not found"
      );
    });

    it("should handle missing identifier", () => {
      const error = new NotFoundError("Task");
      expect(error.message).toBe("Task was not found");
    });
  });

  describe("ConflictError", () => {
    it("should have statusCode 409 and correct errorType", () => {
      const error = new ConflictError("Resource already exists");
      expect(error.statusCode).toBe(409);
      expect(error.errorType).toBe("ConflictError");
      expect(error.message).toBe("Resource already exists");
    });
  });

  describe("TransitionError", () => {
    it("should have statusCode 400 and correct errorType", () => {
      const error = new TransitionError("Planned", "Completed", [
        "In Progress",
        "Cancelled",
      ]);
      expect(error.statusCode).toBe(400);
      expect(error.errorType).toBe("TransitionError");
      expect(error.currentStatus).toBe("Planned");
      expect(error.attemptedStatus).toBe("Completed");
      expect(error.allowedTransitions).toEqual(["In Progress", "Cancelled"]);
      expect(error.message).toBe(
        "Cannot transition from 'Planned' to 'Completed'. Allowed transitions: In Progress, Cancelled"
      );
    });

    it("should handle empty allowed transitions", () => {
      const error = new TransitionError("Completed", "Planned", []);
      expect(error.message).toBe(
        "Cannot transition from 'Completed' to 'Planned'. Allowed transitions: none"
      );
    });
  });
});
