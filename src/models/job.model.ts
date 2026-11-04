import { Document, Schema, Types, model } from "mongoose";

export enum JobStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export const JOB_CATEGORIES = [
  "Design",
  "Tutoring",
  "Data Entry",
  "Writing",
  "Development",
  "Other",
] as const;

export interface IJob extends Document {
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: Date;
  status: JobStatus;
  postedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: JOB_CATEGORIES,
      required: [true, "Category is required"],
    },
    budget: {
      type: Number,
      required: [true, "Budget is required"],
      min: [0, "Budget cannot be negative"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.OPEN,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for faster searching and listing
jobSchema.index({ title: "text", description: "text" });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1 });

export const Job = model<IJob>("Job", jobSchema);