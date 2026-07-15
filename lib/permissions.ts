import { Role } from "@prisma/client";

export type Action = "create" | "read" | "update" | "delete";
export type Resource = "project" | "task" | "user";

export interface PermissionContext {
  userRole: Role;
  userId: string;
  resourceOwnerId?: string | null;
}

/**
 * Determines if a user can perform an action on a resource.
 * - Admin: all actions on all resources
 * - Manager: all actions on projects and tasks
 * - Member: read all; create/update/delete only owned resources
 */
export function canPerformAction(
  action: Action,
  resource: Resource,
  context: PermissionContext
): boolean {
  const { userRole, userId, resourceOwnerId } = context;

  if (userRole === "Admin") return true;

  if (resource === "user") return false; // Only Admin can manage users

  if (userRole === "Manager") return true; // Managers have full project/task access

  // Member role
  if (action === "read") return true;

  // For create, update, delete: must own the resource
  // Null ownerId means legacy data — accessible to all authenticated users
  if (resourceOwnerId === null || resourceOwnerId === undefined) return true;
  return resourceOwnerId === userId;
}
