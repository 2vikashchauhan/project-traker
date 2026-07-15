import { describe, it, expect } from "vitest";
import { canPerformAction, Action, Resource, PermissionContext } from "@/lib/permissions";

describe("canPerformAction", () => {
  const actions: Action[] = ["create", "read", "update", "delete"];
  const resources: Resource[] = ["project", "task", "user"];

  describe("Admin role", () => {
    it("grants access to all actions on all resources", () => {
      for (const action of actions) {
        for (const resource of resources) {
          const result = canPerformAction(action, resource, {
            userRole: "Admin",
            userId: "admin-1",
            resourceOwnerId: "other-user",
          });
          expect(result).toBe(true);
        }
      }
    });

    it("grants access even when resource has no owner (legacy data)", () => {
      const result = canPerformAction("update", "project", {
        userRole: "Admin",
        userId: "admin-1",
        resourceOwnerId: null,
      });
      expect(result).toBe(true);
    });
  });

  describe("Manager role", () => {
    it("grants access to all actions on projects", () => {
      for (const action of actions) {
        const result = canPerformAction(action, "project", {
          userRole: "Manager",
          userId: "manager-1",
          resourceOwnerId: "other-user",
        });
        expect(result).toBe(true);
      }
    });

    it("grants access to all actions on tasks", () => {
      for (const action of actions) {
        const result = canPerformAction(action, "task", {
          userRole: "Manager",
          userId: "manager-1",
          resourceOwnerId: "other-user",
        });
        expect(result).toBe(true);
      }
    });

    it("denies access to user management", () => {
      for (const action of actions) {
        const result = canPerformAction(action, "user", {
          userRole: "Manager",
          userId: "manager-1",
          resourceOwnerId: "other-user",
        });
        expect(result).toBe(false);
      }
    });
  });

  describe("Member role", () => {
    it("grants read access to all resources (projects and tasks)", () => {
      const result1 = canPerformAction("read", "project", {
        userRole: "Member",
        userId: "member-1",
        resourceOwnerId: "other-user",
      });
      const result2 = canPerformAction("read", "task", {
        userRole: "Member",
        userId: "member-1",
        resourceOwnerId: "other-user",
      });
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it("grants create/update/delete on owned resources", () => {
      const writeActions: Action[] = ["create", "update", "delete"];
      for (const action of writeActions) {
        const result = canPerformAction(action, "project", {
          userRole: "Member",
          userId: "member-1",
          resourceOwnerId: "member-1",
        });
        expect(result).toBe(true);
      }
    });

    it("denies create/update/delete on resources owned by others", () => {
      const writeActions: Action[] = ["create", "update", "delete"];
      for (const action of writeActions) {
        const result = canPerformAction(action, "project", {
          userRole: "Member",
          userId: "member-1",
          resourceOwnerId: "other-user",
        });
        expect(result).toBe(false);
      }
    });

    it("grants access to resources with null ownerId (legacy data)", () => {
      const writeActions: Action[] = ["create", "update", "delete"];
      for (const action of writeActions) {
        const result = canPerformAction(action, "task", {
          userRole: "Member",
          userId: "member-1",
          resourceOwnerId: null,
        });
        expect(result).toBe(true);
      }
    });

    it("grants access to resources with undefined ownerId (legacy data)", () => {
      const writeActions: Action[] = ["create", "update", "delete"];
      for (const action of writeActions) {
        const result = canPerformAction(action, "task", {
          userRole: "Member",
          userId: "member-1",
          resourceOwnerId: undefined,
        });
        expect(result).toBe(true);
      }
    });

    it("denies access to user management", () => {
      for (const action of actions) {
        const result = canPerformAction(action, "user", {
          userRole: "Member",
          userId: "member-1",
          resourceOwnerId: "member-1",
        });
        expect(result).toBe(false);
      }
    });
  });
});
