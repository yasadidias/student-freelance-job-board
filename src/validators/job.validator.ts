import { z } from "zod";
import { JOB_CATEGORIES } from "../models/job.model";

const deadlineField = z.coerce
  .date({ message: "Enter a valid deadline date" })
  .refine((d) => d.getTime() > Date.now(), "Deadline must be in the future");

export const createJobSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000),
  category: z.enum(JOB_CATEGORIES, { message: "Choose a valid category" }),
  budget: z.coerce.number().min(0, "Budget cannot be negative").max(10000000),
  deadline: deadlineField,
});

export const updateJobSchema = z
  .object({
    title: z.string().trim().min(5).max(100),
    description: z.string().trim().min(20).max(2000),
    category: z.enum(JOB_CATEGORIES),
    budget: z.coerce.number().min(0).max(10000000),
    deadline: deadlineField,
    status: z.enum(["OPEN", "CLOSED"]),
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, "Send at least one field to update");