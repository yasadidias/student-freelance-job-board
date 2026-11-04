import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { User, UserRole } from "../models/user.model";
import { requireUser, serializeUser } from "../utils/helpers";
import { HttpError } from "../utils/httpError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  };

  const existing = await User.findOne({ email });
  if (existing) {
    throw new HttpError(409, "Email is already registered");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role });

  res.status(201).json({
    success: true,
    message: "Registered successfully",
    data: serializeUser(user),
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  // password has select:false, so ask for it explicitly
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, "Invalid email or password");
  }
  if (user.isBlocked) {
    throw new HttpError(403, "Your account is blocked");
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: serializeUser(user),
      accessToken: signAccessToken(String(user._id), user.role),
      refreshToken: signRefreshToken(String(user._id)),
    },
  });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };

  let userId: string;
  try {
    userId = verifyRefreshToken(refreshToken).sub;
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(userId);
  if (!user || user.isBlocked) {
    throw new HttpError(401, "User not available");
  }

  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: {
      accessToken: signAccessToken(String(user._id), user.role),
      refreshToken: signRefreshToken(String(user._id)),
    },
  });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = requireUser(req);
  res.status(200).json({
    success: true,
    message: "Current user",
    data: serializeUser(user),
  });
};