import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "admin" | "pharmacist" | "cashier";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/**
 * Express middleware that verifies the Supabase JWT from the Authorization header.
 * Attaches the decoded user to `req.user`.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  if (!JWT_SECRET) {
    res.status(500).json({ error: "Server misconfigured: missing JWT secret" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    req.user = {
      id: decoded.sub as string,
      email: decoded.email as string,
      role: (decoded.user_metadata?.role ?? decoded.app_metadata?.role ?? "cashier") as AuthenticatedUser["role"],
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    res.status(401).json({ error: "Invalid token" });
  }
}
