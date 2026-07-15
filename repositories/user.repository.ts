import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Data required to create a user in the database.
 */
export interface UserCreateData {
  email: string;
  name: string;
  hashedPassword: string;
  role: Role;
}

/**
 * Fields returned for safe user reads (excludes hashedPassword).
 */
const userSelectWithoutPassword = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Repository for User data access using Prisma ORM.
 * Handles all database operations for the User model.
 * Ensures hashedPassword is excluded from read queries unless explicitly needed.
 */
export class UserRepository {
  /**
   * Find a user by email address.
   * Includes hashedPassword in the result for password verification during login.
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by ID.
   * Excludes hashedPassword from the result.
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userSelectWithoutPassword,
    });
  }

  /**
   * Create a new user in the database.
   * Returns the created user WITHOUT hashedPassword.
   */
  async create(data: UserCreateData) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        hashedPassword: data.hashedPassword,
        role: data.role,
      },
      select: userSelectWithoutPassword,
    });
  }

  /**
   * Update a user's name by ID.
   * Excludes hashedPassword from the result.
   */
  async updateName(id: string, name: string) {
    return prisma.user.update({
      where: { id },
      data: { name },
      select: userSelectWithoutPassword,
    });
  }

  /**
   * Update a user's role by ID.
   * Excludes hashedPassword from the result.
   */
  async updateRole(id: string, role: Role) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: userSelectWithoutPassword,
    });
  }

  /**
   * Retrieve all users.
   * Excludes hashedPassword from the results.
   */
  async findAll() {
    return prisma.user.findMany({
      select: userSelectWithoutPassword,
    });
  }
}

/**
 * Singleton instance of UserRepository for use across the application.
 */
export const userRepository = new UserRepository();
