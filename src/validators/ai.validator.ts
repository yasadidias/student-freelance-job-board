import { z } from "zod";

export const coverLetterSchema = z.object({
  jobId: z.string().min(1, "Job id is required"),
  notes: z.string().trim().max(500, "Notes are too long").optional(),
});