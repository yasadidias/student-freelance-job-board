import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Job } from "../models/job.model";
import { generateCoverLetter } from "../services/ai.service";
import { assertObjectId, requireUser } from "../utils/helpers";
import { HttpError } from "../utils/httpError";

// POST /api/ai/cover-letter   (USER)
export const createCoverLetter = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = requireUser(req);
  const { jobId, notes } = req.body as { jobId: string; notes?: string };
  assertObjectId(jobId, "job id");

  const job = await Job.findById(jobId);
  if (!job) throw new HttpError(404, "Job not found");

  const result = await generateCoverLetter({
    studentName: user.name,
    jobTitle: job.title,
    jobDescription: job.description,
    category: job.category,
    notes,
  });

  res.status(200).json({
    success: true,
    message: result.source === "ai" ? "Cover letter generated" : "Cover letter generated from template",
    data: result,
  });
};