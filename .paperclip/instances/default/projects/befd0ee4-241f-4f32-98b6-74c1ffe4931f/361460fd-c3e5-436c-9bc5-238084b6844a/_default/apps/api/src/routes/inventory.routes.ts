import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  listDrugs,
  getDrug,
  createDrug,
  updateDrug,
  listStock,
  createStockBatch,
  updateStockBatch,
  getLowStockAlerts,
  getExpiryAlerts,
  listCategories,
} from "../services/inventory.service.js";

const router = Router();

// All inventory routes require authentication
router.use(authMiddleware);

/* ------------------------------------------------------------------ */
/*  Categories                                                        */
/* ------------------------------------------------------------------ */

router.get("/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await listCategories();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to list categories" });
  }
});

/* ------------------------------------------------------------------ */
/*  Drug CRUD                                                         */
/* ------------------------------------------------------------------ */

/**
 * GET /api/inventory/drugs
 * Auth — list/search drugs with optional filters.
 * Query: ?search=&category_id=&is_active=&page=&limit=
 */
router.get("/drugs", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await listDrugs({
      search: req.query.search as string | undefined,
      category_id: req.query.category_id as string | undefined,
      is_active: req.query.is_active !== undefined
        ? req.query.is_active === "true"
        : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to list drugs" });
  }
});

/**
 * GET /api/inventory/drugs/:id
 * Auth — get a single drug by ID.
 */
router.get("/drugs/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getDrug(req.params.id);
    res.json(data);
  } catch (err: any) {
    const status = err.code === "PGRST116" ? 404 : 500;
    res.status(status).json({ error: status === 404 ? "Drug not found" : err.message });
  }
});

/**
 * POST /api/inventory/drugs
 * Pharmacist+ — create a new drug.
 */
router.post(
  "/drugs",
  requireRole("pharmacist"),
  async (req: Request, res: Response): Promise<void> => {
    const { name, unit_price, cost_price } = req.body;

    if (!name || unit_price == null || cost_price == null) {
      res.status(400).json({ error: "name, unit_price, and cost_price are required" });
      return;
    }

    try {
      const data = await createDrug(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      const status = err.code === "23505" ? 409 : 500;
      res.status(status).json({
        error: status === 409 ? "Drug with this barcode already exists" : err.message,
      });
    }
  }
);

/**
 * PATCH /api/inventory/drugs/:id
 * Pharmacist+ — update a drug.
 */
router.patch(
  "/drugs/:id",
  requireRole("pharmacist"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await updateDrug(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      const status = err.code === "PGRST116" ? 404 : 500;
      res.status(status).json({ error: status === 404 ? "Drug not found" : err.message });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  Stock Batches                                                     */
/* ------------------------------------------------------------------ */

/**
 * GET /api/inventory/stock
 * Auth — list stock batches with optional filters.
 * Query: ?drug_id=&include_expired=&include_empty=&page=&limit=
 */
router.get("/stock", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await listStock({
      drug_id: req.query.drug_id as string | undefined,
      include_expired: req.query.include_expired === "true",
      include_empty: req.query.include_empty === "true",
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to list stock" });
  }
});

/**
 * POST /api/inventory/stock
 * Pharmacist+ — add a new stock batch.
 */
router.post(
  "/stock",
  requireRole("pharmacist"),
  async (req: Request, res: Response): Promise<void> => {
    const { drug_id, batch_number, quantity, expiry_date } = req.body;

    if (!drug_id || !batch_number || quantity == null || !expiry_date) {
      res.status(400).json({
        error: "drug_id, batch_number, quantity, and expiry_date are required",
      });
      return;
    }

    try {
      const data = await createStockBatch(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      const status = err.code === "23505" ? 409 : 500;
      res.status(status).json({
        error: status === 409
          ? "Batch with this drug_id and batch_number already exists"
          : err.message,
      });
    }
  }
);

/**
 * PATCH /api/inventory/stock/:id
 * Pharmacist+ — update a stock batch (quantity or expiry_date).
 */
router.patch(
  "/stock/:id",
  requireRole("pharmacist"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await updateStockBatch(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      const status = err.code === "PGRST116" ? 404 : 500;
      res.status(status).json({ error: status === 404 ? "Batch not found" : err.message });
    }
  }
);

/* ------------------------------------------------------------------ */
/*  Alerts                                                            */
/* ------------------------------------------------------------------ */

/**
 * GET /api/inventory/alerts
 * Auth — combined low-stock and expiry alerts.
 * Query: ?within_days=90
 */
router.get("/alerts", async (req: Request, res: Response): Promise<void> => {
  try {
    const withinDays = req.query.within_days ? Number(req.query.within_days) : 90;

    const [lowStock, expiry] = await Promise.all([
      getLowStockAlerts(),
      getExpiryAlerts(withinDays),
    ]);

    res.json({
      low_stock: lowStock,
      expiring: expiry.filter((b) => !b.is_expired),
      expired: expiry.filter((b) => b.is_expired),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to fetch alerts" });
  }
});

export default router;
