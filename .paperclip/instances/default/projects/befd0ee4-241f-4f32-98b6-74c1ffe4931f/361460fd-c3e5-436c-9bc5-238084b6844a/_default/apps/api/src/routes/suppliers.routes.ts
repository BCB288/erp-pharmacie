import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler, AppError } from "../middleware/error.middleware.js";
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder,
} from "../services/supplier.service.js";

const router = Router();

// All supplier routes require authentication
router.use(authMiddleware);

/* ------------------------------------------------------------------ */
/*  Purchase Orders (static paths — must be registered before /:id)    */
/* ------------------------------------------------------------------ */

/**
 * GET /api/suppliers/orders/list
 * Auth — list purchase orders.
 * Query: ?supplier_id=&status=&page=&limit=
 */
router.get(
  "/orders/list",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await listPurchaseOrders({
      supplier_id: req.query.supplier_id as string | undefined,
      status: req.query.status as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  })
);

/**
 * GET /api/suppliers/orders/:id
 * Auth — get a purchase order with items.
 */
router.get(
  "/orders/:id",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await getPurchaseOrder(req.params.id);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116")
        throw new AppError(404, "Purchase order not found");
      throw err;
    }
  })
);

/**
 * POST /api/suppliers/orders
 * Pharmacist+ — create a new purchase order (status = draft).
 * Body: { supplier_id, items: [{ drug_id, quantity_ordered, unit_cost }], notes?, expected_delivery? }
 */
router.post(
  "/orders",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { supplier_id, items } = req.body;

    if (!supplier_id) {
      throw new AppError(400, "supplier_id is required");
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError(400, "items array is required and must not be empty");
    }

    const data = await createPurchaseOrder({
      ...req.body,
      ordered_by: req.user!.id,
    });
    res.status(201).json(data);
  })
);

/**
 * POST /api/suppliers/orders/:id/send
 * Pharmacist+ — transition PO from draft to sent.
 */
router.post(
  "/orders/:id/send",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await sendPurchaseOrder(req.params.id);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116")
        throw new AppError(404, "Purchase order not found");
      if (err.message?.includes("Cannot send"))
        throw new AppError(400, err.message);
      throw err;
    }
  })
);

/**
 * POST /api/suppliers/orders/:id/receive
 * Pharmacist+ — receive stock against a PO.
 * Body: { items: [{ purchase_order_item_id, quantity_received, batch_number, expiry_date }] }
 */
router.post(
  "/orders/:id/receive",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError(400, "items array is required and must not be empty");
    }

    try {
      const data = await receivePurchaseOrder(req.params.id, items);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116")
        throw new AppError(404, "Purchase order not found");
      if (
        err.message?.includes("Cannot receive") ||
        err.message?.includes("Max receivable") ||
        err.message?.includes("PO item not found")
      )
        throw new AppError(400, err.message);
      throw err;
    }
  })
);

/* ------------------------------------------------------------------ */
/*  Supplier CRUD                                                      */
/* ------------------------------------------------------------------ */

/**
 * GET /api/suppliers
 * Auth — list suppliers with optional filters.
 * Query: ?search=&is_active=&page=&limit=
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await listSuppliers({
      search: req.query.search as string | undefined,
      is_active:
        req.query.is_active !== undefined
          ? req.query.is_active === "true"
          : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  })
);

/**
 * POST /api/suppliers
 * Pharmacist+ — create a new supplier.
 */
router.post(
  "/",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    if (!name) {
      throw new AppError(400, "name is required");
    }

    const data = await createSupplier(req.body);
    res.status(201).json(data);
  })
);

/**
 * GET /api/suppliers/:id
 * Auth — get a single supplier.
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await getSupplier(req.params.id);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116") throw new AppError(404, "Supplier not found");
      throw err;
    }
  })
);

/**
 * PATCH /api/suppliers/:id
 * Pharmacist+ — update a supplier.
 */
router.patch(
  "/:id",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await updateSupplier(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116")
        throw new AppError(404, "Supplier not found");
      throw err;
    }
  })
);

export default router;
