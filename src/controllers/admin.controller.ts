import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Application } from "../models/application.model";
import { Job, JobStatus } from "../models/job.model";
import { User, UserRole } from "../models/user.model";
import {
  asString,
  assertObjectId,
  escapeRegex,
  getPagination,
  requireUser,
  serializeUser,
} from "../utils/helpers";
import { HttpError } from "../utils/httpError";

// GET /api/admin/stats
export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [users, managers, students, jobs, openJobs, applications] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: UserRole.MANAGER }),
    User.countDocuments({ role: UserRole.USER }),
    Job.countDocuments(),
    Job.countDocuments({ status: JobStatus.OPEN }),
    Application.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    message: "Stats fetched",
    data: { users, managers, students, jobs, openJobs, applications },
  });
};

// GET /api/admin/users?search=&page=&limit=
export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, skip } = getPagination(req.query, 10);
  const search = asString(req.query.search)?.trim();

  const filter = search
    ? {
        $or: [
          { name: new RegExp(escapeRegex(search), "i") },
          { email: new RegExp(escapeRegex(search), "i") },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Users fetched",
    data: {
      users: users.map(serializeUser),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
};

// PATCH /api/admin/users/:id   - block/unblock or change role
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const admin = requireUser(req);
  const id = String(req.params.id);
  assertObjectId(id, "user id");

  const target = await User.findById(id);
  if (!target) throw new HttpError(404, "User not found");
  if (String(target._id) === String(admin._id)) {
    throw new HttpError(400, "You cannot change your own account here");
  }
  if (target.role === UserRole.ADMIN) {
    throw new HttpError(403, "Admin accounts cannot be changed");
  }

  target.set(req.body);
  await target.save();

  res.status(200).json({ success: true, message: "User updated", data: serializeUser(target) });
};

// DELETE /api/admin/users/:id   - also removes their jobs and applications
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const admin = requireUser(req);
  const id = String(req.params.id);
  assertObjectId(id, "user id");

  const target = await User.findById(id);
  if (!target) throw new HttpError(404, "User not found");
  if (String(target._id) === String(admin._id) || target.role === UserRole.ADMIN) {
    throw new HttpError(403, "This account cannot be deleted");
  }

  const jobs = await Job.find({ postedBy: target._id }).select("_id");
  await Application.deleteMany({
    $or: [{ applicant: target._id }, { job: { $in: jobs.map((j) => j._id) } }],
  });
  await Job.deleteMany({ postedBy: target._id });
  await target.deleteOne();

  res.status(200).json({ success: true, message: "User and related data deleted" });
};