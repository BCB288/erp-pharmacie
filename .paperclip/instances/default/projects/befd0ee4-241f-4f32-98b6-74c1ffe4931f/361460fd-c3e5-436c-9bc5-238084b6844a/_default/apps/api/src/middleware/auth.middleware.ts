import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";

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

/**
 * Express middleware that verifies the Supabase JWT from the Authorization header.
 * Uses Supabase's getUser() for verification — no manual JWT secret needed.
 * Fetches the user's role from the profiles table.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  req.user = {
    id: user.id,
    email: user.email!,
    role: (profile?.role ?? "cashier") as AuthenticatedUser["role"],
  };

  next();
}
