import { hash } from "bcryptjs";
import { ZodError } from "zod";
import { userRepository } from "@/repositories/user.repository";
import { ConflictError, ValidationError } from "@/lib/errors";
import { registerSchema } from "@/validators/auth.validator";

/**
 * Service handling authentication operations such as user registration.
 */
export class AuthService {
  /**
   * Registers a new user with email/password.
   * - Validates input (email format, password length 8-128, name 1-100)
   * - Checks for duplicate email (throws ConflictError)
   * - Hashes password with bcrypt cost factor 10
   * - Creates user with Member role
   * - Returns user without password
   */
  async register(input: { email: string; password: string; name: string }) {
    // Validate input with Zod schema, convert ZodError to ValidationError
    let validated: { email: string; password: string; name: string };
    try {
      validated = registerSchema.parse(input);
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Validation failed", fieldErrors);
      }
      throw error;
    }

    // Check for duplicate email
    const existing = await userRepository.findByEmail(validated.email);
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    // Hash password with bcrypt cost factor 10
    const hashedPassword = await hash(validated.password, 10);

    // Create user with Member role
    const user = await userRepository.create({
      email: validated.email,
      name: validated.name,
      hashedPassword,
      role: "Member",
    });

    // Return user without password
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

/**
 * Singleton instance of AuthService for use across the application.
 */
export const authService = new AuthService();
