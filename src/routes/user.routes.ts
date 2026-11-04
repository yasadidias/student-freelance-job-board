import { Router } from "express";
import { updateAvailability, updateProfile } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { UserRole } from "../models/user.model";
import { availabilitySchema, updateProfileSchema } from "../validators/user.validator";

const router = Router();

router.use(authenticate);

router.put("/me", validate(updateProfileSchema), updateProfile);
router.put(
  "/me/availability",
  authorize(UserRole.USER),
  validate(availabilitySchema),
  updateAvailability
);

export default router;