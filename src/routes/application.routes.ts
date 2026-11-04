import { Router } from "express";
import {
  applyToJob,
  jobApplications,
  myApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "../controllers/application.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { UserRole } from "../models/user.model";
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
} from "../validators/application.validator";

const router = Router();

router.use(authenticate);

// Students
router.post("/", authorize(UserRole.USER), validate(createApplicationSchema), applyToJob);
router.get("/mine", authorize(UserRole.USER), myApplications);
router.delete("/:id", authorize(UserRole.USER), withdrawApplication);

// Clients (job owners) and admins
router.get("/job/:jobId", authorize(UserRole.MANAGER, UserRole.ADMIN), jobApplications);
router.patch(
  "/:id/status",
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus
);

export default router;