import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";
import { IUser } from "../models/user.model";
import { HttpError } from "./httpError";

// Returns the value only when it is a plain string (query params can be arrays/objects)
export const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

export const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const assertObjectId = (id: string, label = "id"): void => {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, `Invalid ${label}`);
  }
};

// Reads ?page= and ?limit= from the query string with safe defaults
export const getPagination = (
  query: { page?: unknown; limit?: unknown },
  defaultLimit = 9,
  maxLimit = 50
) => {
  const page = Math.max(parseInt(asString(query.page) ?? "1", 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(asString(query.limit) ?? String(defaultLimit), 10) || defaultLimit, 1),
    maxLimit
  );
  return { page, limit, skip: (page - 1) * limit };
};

// authenticate() always sets req.user, but TypeScript does not know that.
export const requireUser = (req: AuthRequest) => {
  if (!req.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return req.user;
};

// The shape of a user that we send to the client (never includes the password)
export const serializeUser = (user: IUser) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isBlocked: user.isBlocked,
  availability: user.availability ?? [],
  createdAt: user.createdAt,
});

export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");