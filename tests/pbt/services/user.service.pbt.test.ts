import fc from "fast-check";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "@/services/user.service";
import { ForbiddenError } from "@/lib/errors";

// Mock the user repository
vi.mock("@/repositories/user.repository", () => ({
  userRepository: {
    findById: vi.fn(),
    findAll: vi.fn(),
    updateName: vi.fn(),
    updateRole: vi.fn(),
  },
}));

// Mock the validators module - updateProfileSchema.parse just returns validated data
vi.mock("@/validators/auth.validator", () => ({
  updateProfileSchema: {
    parse: vi.fn((data: { name: string }) => data),
  },
  changeRoleSchema: {
    parse: vi.fn((data: { role: string }) => data),
  },
}));

import { userRepository } from "@/repositories/user.repository";

const mockedRepo = vi.mocked(userRepository);

describe("Property 11: Profile update immutability of protected fields", () => {
  /**
   * Validates: Requirements 7.4
   *
   * For any profile update request, regardless of what fields are included in the
   * request body, the User's email and role SHALL remain unchanged after the operation.
   * The updateProfileSchema is strict so extra fields cause a parse error, but test
   * that the service only calls updateName (not updateEmail or updateRole).
   */

  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  it("updateProfile only calls updateName and never updateRole, for any valid name input", async () => {
    // Generate arbitrary name strings (1-100 chars)
    const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);
    const userIdArb = fc.uuid();
    const emailArb = fc.emailAddress();
    const roleArb = fc.constantFrom("Admin" as const, "Manager" as const, "Member" as const);

    await fc.assert(
      fc.asyncProperty(
        userIdArb,
        nameArb,
        emailArb,
        roleArb,
        async (userId, newName, originalEmail, originalRole) => {
          // Reset mocks for each property run
          vi.clearAllMocks();

          // Set up mocks: user exists with original email and role
          const existingUser = {
            id: userId,
            email: originalEmail,
            name: "Original Name",
            role: originalRole,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          mockedRepo.findById.mockResolvedValue(existingUser);
          mockedRepo.updateName.mockResolvedValue({
            ...existingUser,
            name: newName,
          });

          // Call updateProfile with just a name
          const result = await service.updateProfile(userId, { name: newName });

          // Verify updateName was called (the only mutation operation)
          expect(mockedRepo.updateName).toHaveBeenCalledWith(userId, newName);

          // Verify updateRole was NEVER called
          expect(mockedRepo.updateRole).not.toHaveBeenCalled();

          // Verify the returned profile preserves email and role
          expect(result.email).toBe(originalEmail);
          expect(result.role).toBe(originalRole);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 12: Admin self-role-change prevention", () => {
  /**
   * Validates: Requirements 11.3
   *
   * For any Admin User attempting to change their own role via the admin endpoint,
   * the system SHALL reject the request with ForbiddenError and leave the Admin's
   * role unchanged.
   */

  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  it("changeRole throws ForbiddenError when adminId === targetUserId for any valid role", async () => {
    // Generate arbitrary UUID pairs where adminId === targetUserId and any valid role
    const userIdArb = fc.uuid();
    const roleArb = fc.constantFrom("Admin", "Manager", "Member");

    await fc.assert(
      fc.asyncProperty(userIdArb, roleArb, async (userId, newRole) => {
        // Reset mocks for each property run
        vi.clearAllMocks();

        // Attempt to change own role should always throw ForbiddenError
        await expect(
          service.changeRole(userId, userId, newRole)
        ).rejects.toThrow(ForbiddenError);

        // Verify that no repository methods were called (role unchanged)
        expect(mockedRepo.findById).not.toHaveBeenCalled();
        expect(mockedRepo.updateRole).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});
