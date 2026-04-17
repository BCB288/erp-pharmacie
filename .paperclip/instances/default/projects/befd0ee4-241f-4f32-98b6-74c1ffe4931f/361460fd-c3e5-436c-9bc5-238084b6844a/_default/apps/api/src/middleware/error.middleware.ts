import { Request, Response, NextFunction } from "express";

/**
 * Custom application error with HTTP status code.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Wraps an async route handler so rejected promises are forwarded to
 * the Express error handler instead of causing an unhandled rejection.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

/**
 * 404 handler — catches requests that matched no route.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl,
  });
}

/**
 * Centralized error handler.
 * Must have 4 parameters so Express recognises it as an error middleware.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Log unexpected errors in non-test environments
  if (process.env.NODE_ENV !== "test") {
    console.error("[API Error]", err);
  }

  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
}
