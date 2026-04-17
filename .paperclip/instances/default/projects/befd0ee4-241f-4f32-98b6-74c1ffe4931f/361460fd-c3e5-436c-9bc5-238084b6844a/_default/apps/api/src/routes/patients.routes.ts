import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler, AppError } from "../middleware/error.middleware.js";
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  listPrescriptions,
  getPrescription,
  createPrescription,
  dispensePrescription,
} from "../services/patient.service.js";

const router = Router();

// All patient routes require authentication
router.use(authMiddleware);

/* ------------------------------------------------------------------ */
/*  Prescriptions (static paths — must be registered before /:id)      */
/* ------------------------------------------------------------------ */

/**
 * GET /api/patients/prescriptions/list
 * Pharmacist+ — list prescriptions with filters.
 * Query: ?patient_id=&status=&page=&limit=
 */
router.get(
  "/prescriptions/list",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await listPrescriptions({
      patient_id: req.query.patient_id as string | undefined,
      status: req.query.status as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  })
);

/**
 * GET /api/patients/prescriptions/:id
 * Pharmacist+ — get a single prescription with details.
 */
router.get(
  "/prescriptions/:id",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await getPrescription(req.params.id);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116")
        throw new AppError(404, "Prescription not found");
      throw err;
    }
  })
);

/**
 * POST /api/patients/prescriptions
 * Pharmacist+ — log a new prescription.
 * Body: { patient_id, prescriber_name, prescriber_license?, items, prescribed_date, expiry_date? }
 */
router.post(
  "/prescriptions",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { patient_id, prescriber_name, items, prescribed_date } = req.body;

    if (!patient_id) throw new AppError(400, "patient_id is required");
    if (!prescriber_name)
      throw new AppError(400, "prescriber_name is required");
    if (!items || !Array.isArray(items) || items.length === 0)
      throw new AppError(400, "items array is required and must not be empty");
    if (!prescribed_date)
      throw new AppError(400, "prescribed_date is required");

    const data = await createPrescription(req.body);
    res.status(201).json(data);
  })
);

/**
 * POST /api/patients/prescriptions/:id/dispense
 * Pharmacist+ — mark prescription as dispensed.
 * Body: { sale_id? }
 */
router.post(
  "/prescriptions/:id/dispense",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await dispensePrescription(
        req.params.id,
        req.user!.id,
        req.body.sale_id
      );
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116")
        throw new AppError(404, "Prescription not found");
      if (err.message?.includes("Cannot dispense"))
        throw new AppError(400, err.message);
      throw err;
    }
  })
);

/* ------------------------------------------------------------------ */
/*  Patient CRUD                                                       */
/* ------------------------------------------------------------------ */

/**
 * GET /api/patients
 * Pharmacist+ — list patients with optional search.
 * Query: ?search=&page=&limit=
 */
router.get(
  "/",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await listPatients({
      search: req.query.search as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  })
);

/**
 * POST /api/patients
 * Pharmacist+ — create a new patient.
 */
router.post(
  "/",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { first_name, last_name } = req.body;
    if (!first_name) throw new AppError(400, "first_name is required");
    if (!last_name) throw new AppError(400, "last_name is required");

    const data = await createPatient(req.body);
    res.status(201).json(data);
  })
);

/**
 * GET /api/patients/:id
 * Pharmacist+ — get a single patient.
 */
router.get(
  "/:id",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await getPatient(req.params.id);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116")
        throw new AppError(404, "Patient not found");
      throw err;
    }
  })
);

/**
 * PATCH /api/patients/:id
 * Pharmacist+ — update a patient.
 */
router.patch(
  "/:id",
  requireRole("pharmacist"),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await updatePatient(req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      if (err.code === "PGRST116")
        throw new AppError(404, "Patient not found");
      throw err;
    }
  })
);

export default router;
