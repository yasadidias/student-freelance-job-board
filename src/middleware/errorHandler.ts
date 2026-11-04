import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";

interface MongoLikeError extends Error {
  code?: number;
  errors?: Record<string, { message: string }>;
}

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: "Route not found" });
};

// Turns any thrown error into a consistent JSON response
export const errorHandler = (
  err: MongoLikeError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, message: err.message });
    return;
  }
  if (err.name === "ValidationError" && err.errors) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => ({ message: e.message })),
    });
    return;
  }
  if (err.name === "CastError") {
    res.status(400).json({ success: false, message: "Invalid id format" });
    return;
  }
  if (err.code === 11000) {
    res.status(409).json({ success: false, message: "Duplicate value already exists" });
    return;
  }
  // malformed JSON body etc.
  const status = (err as { status?: number }).status;
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ success: false, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
};