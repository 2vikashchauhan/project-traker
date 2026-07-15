import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "@/services/user.service";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

// Mock the user repository
vi.mock("@/repositories/user.repository", () => ({
  userRepository: {
    findById: vi.fn(),
    findAll: vi.fn(),
    updateName: vi.fn(),
    updateRole: vi.fn(),
  },
}));

// Mock the validators module
vi.mock("@/validators/auth.validator", () => ({
  updateProfileSchema: {
    parse: vi.fn((data: { name: string }) => data),
  },
  changeRoleSchema: {
    parse: vi.fn((data: { role: string }) => data),
  },
}));

import { userRepository } from "@/repositories/user.repository";
import { updateProfileSchema, changeRoleSchema } from "@/validators/auth.validator";

const mockedRepo = vi.mocked(userRepository);
const mockedUpdateProfileSchema = vi.mocked(updateProfileSchema);
const mockedChangeRoleSchema = vi.mocked(changeRoleSchema);

const baseUser = {
  id: "user-uuid-1",
  email: "test@example.com",
  name: "Test User",
  role: "Member" as const,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  describe("getProfile", () => {
    it("should return user profile (id, email, name, role) when user exists", async () => {
      mockedRepo.findById.mockResolvedValue(baseUser);

      const result = await service.getProfile("user-uuid-1");

      expect(mockedRepo.findById).toHaveBeenCalledWith("user-uuid-1");
      expect(result).toEqual({
        id: "user-uuid-1",
        email: "test@example.com",
        name: "Test User",
        role: "Member",
      });
    });

    it("should throw NotFoundError when user does not exist", async () => {
      mockedRepo.findById.mockResolvedValue(null);

      await expect(service.getProfile("nonexistent-id")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("updateProfile", () => {
    it("should update only the name and return updated profile", async () => {
      mockedRepo.findById.mockResolvedValue(baseUser);
      const updatedUser = { ...baseUser, name: "Updated Name" };
      mockedRepo.updateName.mockResolvedValue(updatedUser);
      mockedUpdateProfileSchema.parse.mockReturnValue({ name: "Updated Name" });

      const result = await service.updateProfile("user-uuid-1", {
        name: "Updated Name",
      });

      expect(mockedUpdateProfileSchema.parse).toHaveBeenCalledWith({
        name: "Updated Name",
      });
      expect(mockedRepo.updateName).toHaveBeenCalledWith(
        "user-uuid-1",
        "Updated Name"
      );
      expect(result).toEqual({
        id: "user-uuid-1",
        email: "test@example.com",
        name: "Updated Name",
        role: "Member",
      });
    });

    it("should throw NotFoundError when user does not exist", async () => {
      mockedRepo.findById.mockResolvedValue(null);
      mockedUpdateProfileSchema.parse.mockReturnValue({ name: "New Name" });

      await expect(
        service.updateProfile("nonexistent-id", { name: "New Name" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should validate input through updateProfileSchema", async () => {
      const error = new Error("Validation failed");
      mockedUpdateProfileSchema.parse.mockImplementation(() => {
        throw error;
      });

      await expect(
        service.updateProfile("user-uuid-1", { name: "" })
      ).rejects.toThrow(error);
    });
  });

  describe("listUsers", () => {
    it("should return all users from repository", async () => {
      const users = [
        baseUser,
        { ...baseUser, id: "user-uuid-2", email: "admin@example.com", role: "Admin" as const },
      ];
      mockedRepo.findAll.mockResolvedValue(users);

      const result = await service.listUsers();

      expect(mockedRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it("should return empty array when no users exist", async () => {
      mockedRepo.findAll.mockResolvedValue([]);

      const result = await service.listUsers();

      expect(result).toEqual([]);
    });
  });

  describe("changeRole", () => {
    it("should throw ForbiddenError when admin tries to change own role", async () => {
      await expect(
        service.changeRole("admin-uuid", "admin-uuid", "Member")
      ).rejects.toThrow(ForbiddenError);

      await expect(
        service.changeRole("admin-uuid", "admin-uuid", "Member")
      ).rejects.toThrow("Cannot change your own role");
    });

    it("should change role for a different user", async () => {
      const targetUser = { ...baseUser, id: "target-uuid" };
      mockedRepo.findById.mockResolvedValue(targetUser);
      const updatedUser = { ...targetUser, role: "Manager" as const };
      mockedRepo.updateRole.mockResolvedValue(updatedUser);
      mockedChangeRoleSchema.parse.mockReturnValue({ role: "Manager" });

      const result = await service.changeRole(
        "admin-uuid",
        "target-uuid",
        "Manager"
      );

      expect(mockedChangeRoleSchema.parse).toHaveBeenCalledWith({
        role: "Manager",
      });
      expect(mockedRepo.findById).toHaveBeenCalledWith("target-uuid");
      expect(mockedRepo.updateRole).toHaveBeenCalledWith(
        "target-uuid",
        "Manager"
      );
      expect(result).toEqual(updatedUser);
    });

    it("should throw NotFoundError when target user does not exist", async () => {
      mockedRepo.findById.mockResolvedValue(null);
      mockedChangeRoleSchema.parse.mockReturnValue({ role: "Admin" });

      await expect(
        service.changeRole("admin-uuid", "nonexistent-id", "Admin")
      ).rejects.toThrow(NotFoundError);
    });

    it("should validate role through changeRoleSchema", async () => {
      const error = new Error("Invalid role");
      mockedChangeRoleSchema.parse.mockImplementation(() => {
        throw error;
      });

      await expect(
        service.changeRole("admin-uuid", "target-uuid", "InvalidRole")
      ).rejects.toThrow(error);
    });
  });
});
