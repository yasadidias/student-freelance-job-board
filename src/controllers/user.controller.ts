import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { IAvailabilitySlot } from "../models/user.model";
import { requireUser, serializeUser } from "../utils/helpers";

// PUT /api/users/me   - change my name
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = requireUser(req);
  const { name } = req.body as { name: string };

  user.name = name;
  await user.save();

  res.status(200).json({ success: true, message: "Profile updated", data: serializeUser(user) });
};

// PUT /api/users/me/availability   (USER) - save the weekly free-time grid
export const updateAvailability = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const user = requireUser(req);
  const { availability } = req.body as { availability: IAvailabilitySlot[] };

  // remove duplicate day+hour pairs
  const unique = new Map<string, IAvailabilitySlot>();
  availability.forEach((slot) => unique.set(`${slot.day}-${slot.hour}`, slot));

  user.availability = Array.from(unique.values());
  await user.save();

  res.status(200).json({
    success: true,
    message: "Availability saved",
    data: serializeUser(user),
  });
};