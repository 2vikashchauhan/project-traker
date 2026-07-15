import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changeRoleSchema,
} from "@/validators/auth.validator";

describe("registerSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "securePassword123",
        name: "John Doe",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.password).toBe("securePassword123");
        expect(result.data.name).toBe("John Doe");
      }
    });

    it("should trim email and name whitespace", () => {
      const result = registerSchema.safeParse({
        email: "  user@example.com  ",
        password: "password123",
        name: "  Jane Doe  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.name).toBe("Jane Doe");
      }
    });

    it("should accept password at minimum length (8 chars)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "12345678",
        name: "User",
      });
      expect(result.success).toBe(true);
    });

    it("should accept password at maximum length (128 chars)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "a".repeat(128),
        name: "User",
      });
      expect(result.success).toBe(true);
    });

    it("should accept name at maximum length (100 chars)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "password123",
        name: "A".repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("should reject invalid email format", () => {
      const result = registerSchema.safeParse({
        email: "not-an-email",
        password: "password123",
        name: "User",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email format");
      }
    });

    it("should reject missing email", () => {
      const result = registerSchema.safeParse({
        password: "password123",
        name: "User",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "short",
        name: "User",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must be at least 8 characters"
        );
      }
    });

    it("should reject password exceeding 128 characters", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "a".repeat(129),
        name: "User",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must not exceed 128 characters"
        );
      }
    });

    it("should reject empty name", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "password123",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject name that is only whitespace", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "password123",
        name: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("should reject name exceeding 100 characters", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "password123",
        name: "A".repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Name must not exceed 100 characters"
        );
      }
    });

    it("should reject unknown fields (strict mode)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "password123",
        name: "User",
        extraField: "not allowed",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("loginSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid login data", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("should trim email whitespace", () => {
      const result = loginSchema.safeParse({
        email: "  user@example.com  ",
        password: "password",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });
  });

  describe("invalid inputs", () => {
    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "invalid",
        password: "password",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject unknown fields (strict mode)", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password",
        rememberMe: true,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("updateProfileSchema", () => {
  describe("valid inputs", () => {
    it("should accept a valid name", () => {
      const result = updateProfileSchema.safeParse({
        name: "New Name",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Name");
      }
    });

    it("should trim name whitespace", () => {
      const result = updateProfileSchema.safeParse({
        name: "  Trimmed  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Trimmed");
      }
    });
  });

  describe("invalid inputs", () => {
    it("should reject empty name", () => {
      const result = updateProfileSchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject name exceeding 100 characters", () => {
      const result = updateProfileSchema.safeParse({
        name: "A".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("should reject unknown fields like email (strict mode)", () => {
      const result = updateProfileSchema.safeParse({
        name: "Valid Name",
        email: "hack@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("should reject unknown fields like role (strict mode)", () => {
      const result = updateProfileSchema.safeParse({
        name: "Valid Name",
        role: "Admin",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("changeRoleSchema", () => {
  describe("valid inputs", () => {
    it("should accept Admin role", () => {
      const result = changeRoleSchema.safeParse({ role: "Admin" });
      expect(result.success).toBe(true);
    });

    it("should accept Manager role", () => {
      const result = changeRoleSchema.safeParse({ role: "Manager" });
      expect(result.success).toBe(true);
    });

    it("should accept Member role", () => {
      const result = changeRoleSchema.safeParse({ role: "Member" });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("should reject invalid role value", () => {
      const result = changeRoleSchema.safeParse({ role: "SuperAdmin" });
      expect(result.success).toBe(false);
    });

    it("should reject case-insensitive role values", () => {
      const result = changeRoleSchema.safeParse({ role: "admin" });
      expect(result.success).toBe(false);
    });

    it("should reject unknown fields (strict mode)", () => {
      const result = changeRoleSchema.safeParse({
        role: "Admin",
        userId: "some-id",
      });
      expect(result.success).toBe(false);
    });
  });
});
