import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  getDailySalesSummary,
  getProductMargins,
  getTaxSummary,
} from "../services/report.service.js";

const router = Router();

// All report routes require authentication + admin role
router.use(authMiddleware);
router.use(requireRole("admin"));

/* ------------------------------------------------------------------ */
/*  Daily Sales Summary                                                */
/* ------------------------------------------------------------------ */

/**
 * GET /api/reports/daily-sales
 * Admin only — daily sales summary with payment method breakdown.
 * Query: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
 */
router.get("/daily-sales", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getDailySalesSummary({
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to fetch daily sales summary" });
  }
});

/* ------------------------------------------------------------------ */
/*  Product Margins                                                    */
/* ------------------------------------------------------------------ */

/**
 * GET /api/reports/margins
 * Admin only — product margin analysis (unit_price vs cost_price).
 * Query: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
 */
router.get("/margins", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getProductMargins({
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to fetch product margins" });
  }
});

/* ------------------------------------------------------------------ */
/*  Tax Summary                                                        */
/* ------------------------------------------------------------------ */

/**
 * GET /api/reports/tax-summary
 * Admin only — tax aggregation with daily breakdown.
 * Query: ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
 */
router.get("/tax-summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getTaxSummary({
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to fetch tax summary" });
  }
});

export default router;
