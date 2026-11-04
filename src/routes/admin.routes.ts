import { Router } from "express";
import {
  deleteUser,
  getStats,
  listUsers,
  updateUser,
} from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { UserRole } from "../models/user.model";
import { adminUpdateUserSchema } from "../validators/user.validator";

const router = Router();

// Everything under /api/admin is ADMIN only
router.use(authenticate, authorize(UserRole.ADMIN));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.patch("/users/:id", validate(adminUpdateUserSchema), updateUser);
router.delete("/users/:id", deleteUser);

export default router;