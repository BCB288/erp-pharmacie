import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  createSale,
  getSale,
  listSales,
  voidSale,
} from "../services/pos.service.js";

const router = Router();

// All POS routes require authentication
router.use(authMiddleware);

/* ------------------------------------------------------------------ */
/*  Create Sale                                                        */
/* ------------------------------------------------------------------ */

/**
 * POST /api/pos/sales
 * Auth (any role) — create a new sale with FIFO stock deduction.
 * Body: { items: [{ drug_id, quantity, discount? }], patient_id?, prescription_number?, payment_method?, tax_rate?, notes? }
 */
router.post("/sales", async (req: Request, res: Response): Promise<void> => {
  const { items, patient_id, prescription_number, payment_method, tax_rate, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "items array is required and must not be empty" });
    return;
  }

  for (const item of items) {
    if (!item.drug_id || !item.quantity || item.quantity <= 0) {
      res.status(400).json({
        error: "Each item must have a valid drug_id and quantity > 0",
      });
      return;
    }
  }

  try {
    const sale = await createSale({
      cashier_id: req.user!.id,
      patient_id,
      prescription_number,
      items,
      payment_method,
      tax_rate,
      notes,
    });
    res.status(201).json(sale);
  } catch (err: any) {
    if (err.message?.includes("Insufficient stock")) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err.message?.includes("Drug not found")) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message ?? "Failed to create sale" });
  }
});

/* ------------------------------------------------------------------ */
/*  List Sales                                                         */
/* ------------------------------------------------------------------ */

/**
 * GET /api/pos/sales
 * Auth — list sales with optional filters.
 * Query: ?cashier_id=&status=&date_from=&date_to=&page=&limit=
 */
router.get("/sales", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await listSales({
      cashier_id: req.query.cashier_id as string | undefined,
      status: req.query.status as string | undefined,
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to list sales" });
  }
});

/* ------------------------------------------------------------------ */
/*  Get Sale                                                           */
/* ------------------------------------------------------------------ */

/**
 * GET /api/pos/sales/:id
 * Auth — get a single sale with items.
 */
router.get("/sales/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getSale(req.params.id);
    res.json(data);
  } catch (err: any) {
    const status = err.code === "PGRST116" ? 404 : 500;
    res.status(status).json({
      error: status === 404 ? "Sale not found" : err.message,
    });
  }
});

/* ------------------------------------------------------------------ */
/*  Void Sale                                                          */
/* ------------------------------------------------------------------ */

/**
 * POST /api/pos/sales/:id/void
 * Admin only — void a sale and restore stock.
 */
router.post(
  "/sales/:id/void",
  requireRole("admin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await voidSale(req.params.id);
      res.json(data);
    } catch (err: any) {
      if (err.message?.includes("already voided")) {
        res.status(409).json({ error: err.message });
        return;
      }
      const status = err.code === "PGRST116" ? 404 : 500;
      res.status(status).json({
        error: status === 404 ? "Sale not found" : err.message,
      });
    }
  }
);

export default router;
