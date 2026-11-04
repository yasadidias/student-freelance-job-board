import { Router } from "express";
import {
  createJob,
  deleteJob,
  getJob,
  listJobs,
  myJobs,
  updateJob,
} from "../controllers/job.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { UserRole } from "../models/user.model";
import { createJobSchema, updateJobSchema } from "../validators/job.validator";

const router = Router();
const posters = authorize(UserRole.MANAGER, UserRole.ADMIN);

router.get("/", listJobs);
// "/mine" must come before "/:id", otherwise "mine" would be treated as an id
router.get("/mine", authenticate, posters, myJobs);
router.get("/:id", getJob);
router.post("/", authenticate, posters, validate(createJobSchema), createJob);
router.put("/:id", authenticate, posters, validate(updateJobSchema), updateJob);
router.delete("/:id", authenticate, posters, deleteJob);

export default router;