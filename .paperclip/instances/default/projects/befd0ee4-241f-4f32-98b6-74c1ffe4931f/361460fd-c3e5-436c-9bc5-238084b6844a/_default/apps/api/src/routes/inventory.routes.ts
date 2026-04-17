import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler, AppError } from "../middleware/error.middleware.js";
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

router.get("/categories", asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const data = await listCategories();
  res.json(data);
}));

/* ------------------------------------------------------------------ */
/*  Drug CRUD                                                         */
/* ------------------------------------------------------------------ */

/**
 * GET /api/inventory/drugs
 * Auth — list/search drugs with optional filters.
 * Query: ?search=&category_id=&is_active=&page=&limit=
 */
router.get("/drugs", asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
}));

/**
 * GET /api/inventory/drugs/:id
 * Auth — get a single drug by ID.
 */
router.get("/drugs/:id", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getDrug(req.params.id);
    res.json(data);
  } catch (err: any) {
    if (err.code === "PGRST116") throw new AppError(404, "Drug not found");
    throw err;
  }
}));

/**
 * POST /api/inventory/drugs
 * Pharmacist+ — create a new drug.
 */
router.post(
  "/drugs",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, unit_price, cost_price } = req.body;

    if (!name || unit_price == null || cost_price == null) {
      throw new AppError(400, "name, unit_price, and cost_price are required");
    }

    try {
      const data = await createDrug(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      if (err.code === "23505") throw new AppError(409, "Drug with this barcode already exists");
      throw err;
    }
  })
);

/**
 * PATCH /api/inventory/drugs/:id
 * Pharmacist+ — update a drug.
 */
router.patch(
  "/drugs/:id",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await updateDrug(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116") throw new AppError(404, "Drug not found");
      throw err;
    }
  })
);

/* ------------------------------------------------------------------ */
/*  Stock Batches                                                     */
/* ------------------------------------------------------------------ */

/**
 * GET /api/inventory/stock
 * Auth — list stock batches with optional filters.
 * Query: ?drug_id=&include_expired=&include_empty=&page=&limit=
 */
router.get("/stock", asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await listStock({
    drug_id: req.query.drug_id as string | undefined,
    include_expired: req.query.include_expired === "true",
    include_empty: req.query.include_empty === "true",
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json(result);
}));

/**
 * POST /api/inventory/stock
 * Pharmacist+ — add a new stock batch.
 */
router.post(
  "/stock",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { drug_id, batch_number, quantity, expiry_date } = req.body;

    if (!drug_id || !batch_number || quantity == null || !expiry_date) {
      throw new AppError(400, "drug_id, batch_number, quantity, and expiry_date are required");
    }

    try {
      const data = await createStockBatch(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      if (err.code === "23505") throw new AppError(409, "Batch with this drug_id and batch_number already exists");
      throw err;
    }
  })
);

/**
 * PATCH /api/inventory/stock/:id
 * Pharmacist+ — update a stock batch (quantity or expiry_date).
 */
router.patch(
  "/stock/:id",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await updateStockBatch(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116") throw new AppError(404, "Batch not found");
      throw err;
    }
  })
);

/* ------------------------------------------------------------------ */
/*  Alerts                                                            */
/* ------------------------------------------------------------------ */

/**
 * GET /api/inventory/alerts
 * Auth — combined low-stock and expiry alerts.
 * Query: ?within_days=90
 */
router.get("/alerts", asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
}));

export default router;
