import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { UserRole } from "../models/user.model";

export interface AccessPayload extends JwtPayload {
  sub: string;
  role: UserRole;
}

export interface RefreshPayload extends JwtPayload {
  sub: string;
}

// Secrets are read when needed (not at import time) so dotenv has already run.
const getSecret = (name: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined in .env`);
  }
  return value;
};

export const signAccessToken = (userId: string, role: UserRole): string =>
  jwt.sign({ sub: userId, role }, getSecret("JWT_SECRET"), {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "15m") as SignOptions["expiresIn"],
  });

export const signRefreshToken = (userId: string): string =>
  jwt.sign({ sub: userId }, getSecret("JWT_REFRESH_SECRET"), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string): AccessPayload =>
  jwt.verify(token, getSecret("JWT_SECRET")) as AccessPayload;

export const verifyRefreshToken = (token: string): RefreshPayload =>
  jwt.verify(token, getSecret("JWT_REFRESH_SECRET")) as RefreshPayload;