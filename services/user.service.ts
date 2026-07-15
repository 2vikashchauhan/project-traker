import { userRepository } from "@/repositories/user.repository";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { updateProfileSchema, changeRoleSchema } from "@/validators/auth.validator";
import { Role } from "@prisma/client";

/**
 * Service layer for user profile and admin user management.
 * Handles profile retrieval, profile updates, user listing, and role changes.
 */
export class UserService {
  /**
   * Returns profile for the given user ID (id, email, name, role).
   * Throws NotFoundError if the user does not exist.
   */
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  /**
   * Updates only the name field for the given user.
   * Ignores any email or role fields in the payload (strict schema rejects them).
   * Throws NotFoundError if the user does not exist.
   */
  async updateProfile(userId: string, data: { name: string }) {
    const validated = updateProfileSchema.parse(data);

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const updated = await userRepository.updateName(userId, validated.name);
    return { id: updated.id, email: updated.email, name: updated.name, role: updated.role };
  }

  /**
   * Admin: lists all users (id, email, name, role, createdAt).
   * Returns the full user list from the repository.
   */
  async listUsers() {
    return userRepository.findAll();
  }

  /**
   * Admin: changes a user's role.
   * Rejects self-role-change with ForbiddenError.
   * Throws NotFoundError if the target user does not exist.
   */
  async changeRole(adminId: string, targetUserId: string, newRole: string) {
    if (adminId === targetUserId) {
      throw new ForbiddenError("Cannot change your own role");
    }

    const validated = changeRoleSchema.parse({ role: newRole });

    const user = await userRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundError("User", targetUserId);
    }

    return userRepository.updateRole(targetUserId, validated.role as Role);
  }
}

/**
 * Singleton instance of UserService for use across the application.
 */
export const userService = new UserService();
