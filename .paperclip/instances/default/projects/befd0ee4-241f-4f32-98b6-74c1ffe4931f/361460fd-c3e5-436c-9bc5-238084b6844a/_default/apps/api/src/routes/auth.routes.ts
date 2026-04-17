import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

/**
 * POST /api/auth/login
 * Public — authenticate with email + password via Supabase Auth.
 */
router.post("/login", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profile && !profile.is_active) {
    res.status(403).json({ error: "Account is deactivated" });
    return;
  }

  res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: profile?.full_name ?? null,
      role: profile?.role ?? "cashier",
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
}));

/**
 * POST /api/auth/register
 * Admin only — create a new staff account with a specified role.
 */
router.post(
  "/register",
  authMiddleware,
  requireRole("admin"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, full_name, role, phone } = req.body;

    if (!email || !password || !full_name || !role) {
      res.status(400).json({
        error: "email, password, full_name, and role are required",
      });
      return;
    }

    const validRoles = ["admin", "pharmacist", "cashier"];
    if (!validRoles.includes(role)) {
      res
        .status(400)
        .json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, full_name },
      });

    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        full_name,
        role,
        phone: phone ?? null,
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      res.status(500).json({ error: "Failed to create user profile" });
      return;
    }

    res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role,
      },
    });
  })
);

/**
 * GET /api/auth/me
 * Auth — return the current user's profile.
 */
router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json({
      id: profile.id,
      email: req.user!.email,
      full_name: profile.full_name,
      role: profile.role,
      phone: profile.phone,
      is_active: profile.is_active,
      created_at: profile.created_at,
    });
  })
);

export default router;
