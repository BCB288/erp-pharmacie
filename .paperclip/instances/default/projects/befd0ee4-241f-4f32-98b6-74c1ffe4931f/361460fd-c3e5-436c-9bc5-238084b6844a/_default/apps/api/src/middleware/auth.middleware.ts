import { Request, Response, NextFunction } from "express";
import { supabase, createAuthClient, supabaseStorage } from "../lib/supabase.js";

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
 * Creates a per-request Supabase client scoped to the authenticated user so that
 * downstream services respect RLS policies without needing the service-role key.
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

  // Create a user-scoped client for this request
  const userClient = createAuthClient(token);

  const { data: profile } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  req.user = {
    id: user.id,
    email: user.email!,
    role: (profile?.role ?? "cashier") as AuthenticatedUser["role"],
  };

  // Run downstream handlers within AsyncLocalStorage so all supabase
  // imports automatically resolve to the user-scoped client
  supabaseStorage.run(userClient, () => next());
}
