import { Request, Response, NextFunction } from "express";
import type { AuthenticatedUser } from "./auth.middleware.js";

type Role = AuthenticatedUser["role"];

/**
 * Role hierarchy: admin > pharmacist > cashier.
 * A higher role implicitly includes all lower role permissions.
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  pharmacist: 2,
  cashier: 1,
};

/**
 * Creates middleware that restricts access to users with the minimum required role.
 *
 * Usage:
 *   router.post("/drugs", authMiddleware, requireRole("pharmacist"), handler);
 *   router.delete("/users/:id", authMiddleware, requireRole("admin"), handler);
 */
export function requireRole(minimumRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      res.status(403).json({
        error: "Insufficient permissions",
        required: minimumRole,
        current: user.role,
      });
      return;
    }

    next();
  };
}
