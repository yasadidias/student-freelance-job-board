import { z } from "zod";
import { DAYS } from "../models/user.model";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
});

export const availabilitySchema = z.object({
  availability: z
    .array(
      z.object({
        day: z.enum(DAYS),
        hour: z.number().int().min(0).max(23),
      })
    )
    .max(7 * 24, "Too many slots"),
});

export const adminUpdateUserSchema = z
  .object({
    isBlocked: z.boolean(),
    role: z.enum(["USER", "MANAGER"]),
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, "Send at least one field to update");