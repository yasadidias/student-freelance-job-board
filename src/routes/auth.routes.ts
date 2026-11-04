import { Router } from "express";
import { getMe, login, refresh, register } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.get("/me", authenticate, getMe);

export default router;