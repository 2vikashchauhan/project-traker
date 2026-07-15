import fc from "fast-check";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { compare } from "bcryptjs";
import { AuthService } from "@/services/auth.service";
import { ConflictError, ValidationError } from "@/lib/errors";

// Mock the user repository
vi.mock("@/repositories/user.repository", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
}));

import { userRepository } from "@/repositories/user.repository";

const mockedRepo = vi.mocked(userRepository);

// --- Arbitraries ---

/** Generates a valid email address */
const validEmailArb = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 20 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
    fc.constantFrom("com", "org", "net", "io", "dev")
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Generates a valid password (8-128 chars, printable ASCII to avoid bcrypt NUL-byte truncation) */
const validPasswordArb = fc.stringOf(
  fc.integer({ min: 0x20, max: 0x7e }).map((c) => String.fromCharCode(c)),
  { minLength: 8, maxLength: 64 }
);

/** Generates a valid name (1-100 chars, non-whitespace-only) */
const validNameArb = fc
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length >= 1 && s.trim().length <= 100);

/** Generates a valid registration input */
const validRegistrationArb = fc.record({
  email: validEmailArb,
  password: validPasswordArb,
  name: validNameArb,
});

describe("Auth Service Property Tests", () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
  });

  /**
   * Property 1: Registration assigns Member role
   *
   * Validates: Requirements 1.1
   *
   * For any valid registration input (valid email, password 8-128 chars, name 1-100 chars),
   * the created User record SHALL have the role set to "Member".
   */
  describe("Property 1: Registration assigns Member role", () => {
    it("for any valid registration input, the created user SHALL have role 'Member'", { timeout: 30000 }, () => {
      return fc.assert(
        fc.asyncProperty(validRegistrationArb, async (input) => {
          // Mock: no existing user with that email
          mockedRepo.findByEmail.mockResolvedValue(null);
          // Mock: return created user with the data that was passed to create
          mockedRepo.create.mockImplementation(async (data: any) => ({
            id: "generated-uuid",
            email: data.email,
            name: data.name,
            role: data.role,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          const result = await service.register(input);

          // The role must be Member
          expect(result.role).toBe("Member");

          // Verify the repository was called with role "Member"
          expect(mockedRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({ role: "Member" })
          );
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 2: Password hashing integrity
   *
   * Validates: Requirements 1.2, 10.1
   *
   * For any password submitted during registration, the stored value SHALL be a valid
   * bcrypt hash with cost factor >= 10, and comparing the original password against
   * the hash SHALL return true.
   */
  describe("Property 2: Password hashing integrity", () => {
    it("for any valid password, the stored hash SHALL be valid bcrypt with cost >= 10 and verify correctly", { timeout: 60000 }, () => {
      return fc.assert(
        fc.asyncProperty(validRegistrationArb, async (input) => {
          mockedRepo.findByEmail.mockResolvedValue(null);

          let capturedHash: string | undefined;
          mockedRepo.create.mockImplementation(async (data: any) => {
            capturedHash = data.hashedPassword;
            return {
              id: "generated-uuid",
              email: data.email,
              name: data.name,
              role: data.role,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          });

          await service.register(input);

          // The hash must be defined
          expect(capturedHash).toBeDefined();

          // The hash must be a valid bcrypt hash (starts with $2a$ or $2b$)
          expect(capturedHash).toMatch(/^\$2[aby]\$/);

          // Extract cost factor from the hash (format: $2b$XX$ where XX is the cost)
          const costFactor = parseInt(capturedHash!.split("$")[2], 10);
          expect(costFactor).toBeGreaterThanOrEqual(10);

          // The original password must verify against the hash
          const isValid = await compare(input.password, capturedHash!);
          expect(isValid).toBe(true);
        }),
        { numRuns: 10 } // Reduced runs because bcrypt hashing + verification is CPU-intensive
      );
    });
  });

  /**
   * Property 3: Duplicate email rejection
   *
   * Validates: Requirements 1.3
   *
   * For any email string, if a User with that email already exists in the database,
   * a subsequent registration attempt with the same email SHALL return a ConflictError.
   */
  describe("Property 3: Duplicate email rejection", () => {
    it("for any email that already exists, registration SHALL throw ConflictError", () => {
      return fc.assert(
        fc.asyncProperty(validRegistrationArb, async (input) => {
          // Mock: a user already exists with this email
          mockedRepo.findByEmail.mockResolvedValue({
            id: "existing-uuid",
            email: input.email,
            name: "Existing User",
            hashedPassword: "$2b$10$hashedvalue",
            role: "Member",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);

          // Registration should throw ConflictError
          await expect(service.register(input)).rejects.toThrow(ConflictError);

          // User should NOT be created
          expect(mockedRepo.create).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Registration input validation
   *
   * Validates: Requirements 1.4, 1.5, 1.6, 10.6
   *
   * For any registration input where the email format is invalid, OR the password is
   * shorter than 8 characters, OR the password exceeds 128 characters, OR the name is
   * empty, OR the name exceeds 100 characters, the Registration_Handler SHALL return
   * a ValidationError and NOT create a User record.
   */
  describe("Property 4: Registration input validation", () => {
    /** Generates an invalid email (no @ sign, or missing domain parts) */
    const invalidEmailArb = fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("@")),
      fc.string({ minLength: 1, maxLength: 50 }).map((s) => `${s}@`),
      fc.string({ minLength: 1, maxLength: 50 }).map((s) => `@${s}`),
      fc.constant(""),
      fc.string({ minLength: 1, maxLength: 20 }).map((s) => `${s}@.`),
      fc.string({ minLength: 1, maxLength: 20 }).map((s) => `${s}@domain`)
    );

    /** Generates a too-short password (less than 8 chars) */
    const tooShortPasswordArb = fc.string({ minLength: 0, maxLength: 7 });

    /** Generates a too-long password (more than 128 chars) */
    const tooLongPasswordArb = fc.stringOf(
      fc.integer({ min: 0x20, max: 0x7e }).map((c) => String.fromCharCode(c)),
      { minLength: 129, maxLength: 200 }
    );

    /** Generates an empty name or whitespace-only name */
    const emptyNameArb = fc.oneof(
      fc.constant(""),
      fc.stringOf(fc.constant(" "), { minLength: 1, maxLength: 10 })
    );

    /** Generates a name that exceeds 100 characters */
    const tooLongNameArb = fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
      { minLength: 101, maxLength: 150 }
    );

    it("invalid email format SHALL cause ValidationError", () => {
      return fc.assert(
        fc.asyncProperty(
          invalidEmailArb,
          validPasswordArb,
          validNameArb,
          async (email, password, name) => {
            mockedRepo.findByEmail.mockResolvedValue(null);

            await expect(
              service.register({ email, password, name })
            ).rejects.toThrow(ValidationError);

            expect(mockedRepo.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("password shorter than 8 characters SHALL cause ValidationError", () => {
      return fc.assert(
        fc.asyncProperty(
          validEmailArb,
          tooShortPasswordArb,
          validNameArb,
          async (email, password, name) => {
            mockedRepo.findByEmail.mockResolvedValue(null);

            await expect(
              service.register({ email, password, name })
            ).rejects.toThrow(ValidationError);

            expect(mockedRepo.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("password exceeding 128 characters SHALL cause ValidationError", () => {
      return fc.assert(
        fc.asyncProperty(
          validEmailArb,
          tooLongPasswordArb,
          validNameArb,
          async (email, password, name) => {
            mockedRepo.findByEmail.mockResolvedValue(null);

            await expect(
              service.register({ email, password, name })
            ).rejects.toThrow(ValidationError);

            expect(mockedRepo.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("empty name SHALL cause ValidationError", () => {
      return fc.assert(
        fc.asyncProperty(
          validEmailArb,
          validPasswordArb,
          emptyNameArb,
          async (email, password, name) => {
            mockedRepo.findByEmail.mockResolvedValue(null);

            await expect(
              service.register({ email, password, name })
            ).rejects.toThrow(ValidationError);

            expect(mockedRepo.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("name exceeding 100 characters SHALL cause ValidationError", () => {
      return fc.assert(
        fc.asyncProperty(
          validEmailArb,
          validPasswordArb,
          tooLongNameArb,
          async (email, password, name) => {
            mockedRepo.findByEmail.mockResolvedValue(null);

            await expect(
              service.register({ email, password, name })
            ).rejects.toThrow(ValidationError);

            expect(mockedRepo.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
