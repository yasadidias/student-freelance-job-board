import { Router } from "express";
import { createCoverLetter } from "../controllers/ai.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { UserRole } from "../models/user.model";
import { coverLetterSchema } from "../validators/ai.validator";

const router = Router();

router.post(
  "/cover-letter",
  authenticate,
  authorize(UserRole.USER),
  validate(coverLetterSchema),
  createCoverLetter
);

export default router;