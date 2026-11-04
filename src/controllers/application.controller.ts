import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Application, ApplicationStatus } from "../models/application.model";
import { IJob, Job, JobStatus } from "../models/job.model";
import { IUser, UserRole } from "../models/user.model";
import { sendApplicationStatusEmail } from "../services/email.service";
import { assertObjectId, requireUser } from "../utils/helpers";
import { HttpError } from "../utils/httpError";

// POST /api/applications   (USER)
export const applyToJob = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = requireUser(req);
  const { jobId, coverLetter } = req.body as { jobId: string; coverLetter: string };
  assertObjectId(jobId, "job id");

  const job = await Job.findById(jobId);
  if (!job) throw new HttpError(404, "Job not found");
  if (job.status !== JobStatus.OPEN) {
    throw new HttpError(400, "This job is closed");
  }
  if (job.deadline.getTime() < Date.now()) {
    throw new HttpError(400, "The deadline for this job has passed");
  }

  const existing = await Application.findOne({ job: job._id, applicant: user._id });
  if (existing) {
    throw new HttpError(409, "You have already applied to this job");
  }

  const application = await Application.create({
    job: job._id,
    applicant: user._id,
    coverLetter,
  });

  res.status(201).json({
    success: true,
    message: "Application submitted",
    data: application,
  });
};

// GET /api/applications/mine   (USER)
export const myApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = requireUser(req);
  const applications = await Application.find({ applicant: user._id })
    .sort({ createdAt: -1 })
    .populate({ path: "job", select: "title category budget deadline status" });

  res.status(200).json({ success: true, message: "Your applications", data: applications });
};

// GET /api/applications/job/:jobId   (job owner or ADMIN)
export const jobApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = requireUser(req);
  const jobId = String(req.params.jobId);
  assertObjectId(jobId, "job id");

  const job = await Job.findById(jobId);
  if (!job) throw new HttpError(404, "Job not found");
  if (String(job.postedBy) !== String(user._id) && user.role !== UserRole.ADMIN) {
    throw new HttpError(403, "You can only view applications for your own jobs");
  }

  // availability is included so the client can see the student's free times
  const applications = await Application.find({ job: job._id })
    .sort({ createdAt: -1 })
    .populate("applicant", "name email availability");

  res.status(200).json({
    success: true,
    message: "Applications fetched",
    data: { job, applications },
  });
};

// PATCH /api/applications/:id/status   (job owner or ADMIN)
export const updateApplicationStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const user = requireUser(req);
  const id = String(req.params.id);
  assertObjectId(id, "application id");
  const { status } = req.body as { status: "ACCEPTED" | "REJECTED" };

  const application = await Application.findById(id)
    .populate<{ job: IJob }>("job")
    .populate<{ applicant: IUser }>("applicant", "name email");
  if (!application) throw new HttpError(404, "Application not found");

  const job = application.job;
  if (String(job.postedBy) !== String(user._id) && user.role !== UserRole.ADMIN) {
    throw new HttpError(403, "You can only manage applications for your own jobs");
  }

  application.status =
    status === "ACCEPTED" ? ApplicationStatus.ACCEPTED : ApplicationStatus.REJECTED;
  await application.save();

  // Email the student (does not throw on failure)
  await sendApplicationStatusEmail({
    to: application.applicant.email,
    studentName: application.applicant.name,
    jobTitle: job.title,
    status,
  });

  res.status(200).json({
    success: true,
    message: `Application ${status.toLowerCase()}`,
    data: application,
  });
};

// DELETE /api/applications/:id   (the applicant, only while PENDING)
export const withdrawApplication = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const user = requireUser(req);
  const id = String(req.params.id);
  assertObjectId(id, "application id");

  const application = await Application.findById(id);
  if (!application) throw new HttpError(404, "Application not found");
  if (String(application.applicant) !== String(user._id)) {
    throw new HttpError(403, "You can only withdraw your own applications");
  }
  if (application.status !== ApplicationStatus.PENDING) {
    throw new HttpError(400, "Only pending applications can be withdrawn");
  }

  await application.deleteOne();
  res.status(200).json({ success: true, message: "Application withdrawn" });
};