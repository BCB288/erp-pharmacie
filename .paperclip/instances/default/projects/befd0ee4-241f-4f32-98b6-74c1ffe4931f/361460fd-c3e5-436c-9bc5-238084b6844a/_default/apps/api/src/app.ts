import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import posRoutes from "./routes/pos.routes.js";
import supplierRoutes from "./routes/suppliers.routes.js";
import patientRoutes from "./routes/patients.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

export const app = express();

// --------------- Global middleware ---------------

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// --------------- Health check ---------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --------------- Routes ---------------

app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/patients", patientRoutes);

// --------------- Error handling (must come after routes) ---------------

app.use(notFoundHandler);
app.use(errorHandler);
