import { z } from "zod";

export const createApplicationSchema = z.object({
  jobId: z.string().min(1, "Job id is required"),
  coverLetter: z
    .string()
    .trim()
    .min(20, "Cover letter must be at least 20 characters")
    .max(2000),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"], {
    message: "Status must be ACCEPTED or REJECTED",
  }),
});