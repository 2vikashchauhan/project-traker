import fc from "fast-check";
import { describe, it, expect } from "vitest";
import { canPerformAction, Action, Resource, PermissionContext } from "@/lib/permissions";

// --- Arbitraries ---

/** Generates any valid Action */
const actionArb = fc.constantFrom<Action>("create", "read", "update", "delete");

/** Generates write actions (create, update, delete) */
const writeActionArb = fc.constantFrom<Action>("create", "update", "delete");

/** Generates any valid Resource (project or task — excludes "user" since that is Admin-only) */
const projectOrTaskResourceArb = fc.constantFrom<Resource>("project", "task");

/** Generates any valid Resource including "user" */
const allResourceArb = fc.constantFrom<Resource>("project", "task", "user");

/** Generates a UUID-like user ID */
const userIdArb = fc.uuid();

/** Generates a resource owner ID that is either a UUID, null, or undefined */
const ownerIdArb = fc.oneof(
  fc.uuid(),
  fc.constant(null),
  fc.constant(undefined)
);

/**
 * Property 9: Role-based access control consistency
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 *
 * For any User and any resource (project or task), the `canPerformAction` function SHALL return:
 * - `true` for all actions when the User's role is Admin
 * - `true` for all CRUD actions on projects/tasks when the User's role is Manager
 * - `true` for read actions when the User's role is Member
 * - `true` for create/update/delete actions when the User's role is Member AND the resource is owned by that User (or has null owner)
 * - `false` for create/update/delete actions when the User's role is Member AND the resource is owned by a different User
 */
describe("Property 9: Role-based access control consistency", () => {
  describe("Admin role: full access to all actions on all resources", () => {
    it("Admin SHALL have access to all actions on all resources", () => {
      fc.assert(
        fc.property(actionArb, allResourceArb, userIdArb, ownerIdArb, (action, resource, userId, ownerId) => {
          const context: PermissionContext = {
            userRole: "Admin",
            userId,
            resourceOwnerId: ownerId,
          };

          expect(canPerformAction(action, resource, context)).toBe(true);
        }),
        { numRuns: 200 }
      );
    });
  });

  describe("Manager role: full CRUD access on projects and tasks", () => {
    it("Manager SHALL have access to all CRUD actions on projects and tasks", () => {
      fc.assert(
        fc.property(actionArb, projectOrTaskResourceArb, userIdArb, ownerIdArb, (action, resource, userId, ownerId) => {
          const context: PermissionContext = {
            userRole: "Manager",
            userId,
            resourceOwnerId: ownerId,
          };

          expect(canPerformAction(action, resource, context)).toBe(true);
        }),
        { numRuns: 200 }
      );
    });
  });

  describe("Member role: read access to all resources", () => {
    it("Member SHALL have read access to all projects and tasks", () => {
      fc.assert(
        fc.property(projectOrTaskResourceArb, userIdArb, ownerIdArb, (resource, userId, ownerId) => {
          const context: PermissionContext = {
            userRole: "Member",
            userId,
            resourceOwnerId: ownerId,
          };

          expect(canPerformAction("read", resource, context)).toBe(true);
        }),
        { numRuns: 200 }
      );
    });
  });

  describe("Member role: write access to owned resources or null-owner resources", () => {
    it("Member SHALL have create/update/delete access when resource is owned by that User", () => {
      fc.assert(
        fc.property(writeActionArb, projectOrTaskResourceArb, userIdArb, (action, resource, userId) => {
          const context: PermissionContext = {
            userRole: "Member",
            userId,
            resourceOwnerId: userId, // same user owns the resource
          };

          expect(canPerformAction(action, resource, context)).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    it("Member SHALL have create/update/delete access when resource has null owner (legacy data)", () => {
      fc.assert(
        fc.property(writeActionArb, projectOrTaskResourceArb, userIdArb, (action, resource, userId) => {
          const context: PermissionContext = {
            userRole: "Member",
            userId,
            resourceOwnerId: null,
          };

          expect(canPerformAction(action, resource, context)).toBe(true);
        }),
        { numRuns: 200 }
      );
    });

    it("Member SHALL have create/update/delete access when resource has undefined owner", () => {
      fc.assert(
        fc.property(writeActionArb, projectOrTaskResourceArb, userIdArb, (action, resource, userId) => {
          const context: PermissionContext = {
            userRole: "Member",
            userId,
            resourceOwnerId: undefined,
          };

          expect(canPerformAction(action, resource, context)).toBe(true);
        }),
        { numRuns: 200 }
      );
    });
  });

  describe("Member role: denied write access to resources owned by other users", () => {
    it("Member SHALL be denied create/update/delete when resource is owned by a different User", () => {
      fc.assert(
        fc.property(
          writeActionArb,
          projectOrTaskResourceArb,
          userIdArb,
          userIdArb.filter((id) => id.length > 0),
          (action, resource, userId, otherUserId) => {
            // Ensure the IDs are actually different
            fc.pre(userId !== otherUserId);

            const context: PermissionContext = {
              userRole: "Member",
              userId,
              resourceOwnerId: otherUserId,
            };

            expect(canPerformAction(action, resource, context)).toBe(false);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe("Non-Admin roles: denied access to user resource management", () => {
    it("Manager SHALL be denied access to user resource actions", () => {
      fc.assert(
        fc.property(actionArb, userIdArb, ownerIdArb, (action, userId, ownerId) => {
          const context: PermissionContext = {
            userRole: "Manager",
            userId,
            resourceOwnerId: ownerId,
          };

          // Managers cannot manage users (only Admins can)
          expect(canPerformAction(action, "user", context)).toBe(false);
        }),
        { numRuns: 200 }
      );
    });

    it("Member SHALL be denied access to user resource actions", () => {
      fc.assert(
        fc.property(actionArb, userIdArb, ownerIdArb, (action, userId, ownerId) => {
          const context: PermissionContext = {
            userRole: "Member",
            userId,
            resourceOwnerId: ownerId,
          };

          // Members cannot manage users (only Admins can)
          expect(canPerformAction(action, "user", context)).toBe(false);
        }),
        { numRuns: 200 }
      );
    });
  });
});
