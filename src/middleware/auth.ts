import { NextFunction, Request, Response } from "express";
import { IUser, User, UserRole } from "../models/user.model";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: IUser;
}

// Reads "Authorization: Bearer <token>", verifies it and loads the user.
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Access token missing" });
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ success: false, message: "User no longer exists" });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ success: false, message: "Your account is blocked" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Allows only the listed roles (use after authenticate).
export const authorize =
  (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to do this",
      });
      return;
    }
    next();
  };