import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Application } from "../models/application.model";
import { IJob, Job, JobStatus } from "../models/job.model";
import { UserRole } from "../models/user.model";
import {
  asString,
  assertObjectId,
  escapeRegex,
  getPagination,
  requireUser,
} from "../utils/helpers";
import { HttpError } from "../utils/httpError";

const POSTER_FIELDS = "name email";

// GET /api/jobs?search=&category=&status=&page=&limit=   (public)
export const listJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page, limit, skip } = getPagination(req.query);
  const search = asString(req.query.search)?.trim();
  const category = asString(req.query.category);
  const status = asString(req.query.status);

  const filter: Record<string, unknown> = {};
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: regex }, { description: regex }];
  }
  if (category) filter.category = category;
  // Public list shows OPEN jobs unless a status filter is given
  filter.status = status === "CLOSED" ? JobStatus.CLOSED : JobStatus.OPEN;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", POSTER_FIELDS),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Jobs fetched",
    data: {
      jobs,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
};

// GET /api/jobs/:id   (public)
export const getJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  assertObjectId(id, "job id");

  const job = await Job.findById(id).populate("postedBy", POSTER_FIELDS);
  if (!job) throw new HttpError(404, "Job not found");

  res.status(200).json({ success: true, message: "Job fetched", data: job });
};

// GET /api/jobs/mine   (MANAGER, ADMIN)  - jobs I posted, with application counts
export const myJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = requireUser(req);
  const jobs = await Job.find({ postedBy: user._id }).sort({ createdAt: -1 });

  const counts = await Application.aggregate<{ _id: unknown; count: number }>([
    { $match: { job: { $in: jobs.map((j) => j._id) } } },
    { $group: { _id: "$job", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = jobs.map((job) => ({
    ...job.toObject(),
    applicationCount: countMap.get(String(job._id)) ?? 0,
  }));

  res.status(200).json({ success: true, message: "Your jobs", data });
};

// POST /api/jobs   (MANAGER, ADMIN)
export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = requireUser(req);
  const job = await Job.create({ ...req.body, postedBy: user._id });

  res.status(201).json({ success: true, message: "Job posted", data: job });
};

// Only the owner or an admin may change a job
const findOwnedJob = async (req: AuthRequest): Promise<IJob> => {
  const user = requireUser(req);
  const id = String(req.params.id);
  assertObjectId(id, "job id");

  const job = await Job.findById(id);
  if (!job) throw new HttpError(404, "Job not found");

  const isOwner = String(job.postedBy) === String(user._id);
  if (!isOwner && user.role !== UserRole.ADMIN) {
    throw new HttpError(403, "You can only change your own jobs");
  }
  return job;
};

// PUT /api/jobs/:id   (owner or ADMIN)
export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const job = await findOwnedJob(req);
  job.set(req.body);
  await job.save();

  res.status(200).json({ success: true, message: "Job updated", data: job });
};

// DELETE /api/jobs/:id   (owner or ADMIN) - also removes its applications
export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const job = await findOwnedJob(req);
  await Application.deleteMany({ job: job._id });
  await job.deleteOne();

  res.status(200).json({ success: true, message: "Job deleted" });
};