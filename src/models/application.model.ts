import { Document, Schema, Types, model } from "mongoose";

export enum ApplicationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export interface IApplication extends Document {
  job: Types.ObjectId;
  applicant: Types.ObjectId;
  coverLetter: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      required: [true, "Cover letter is required"],
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING,
    },
  },
  { timestamps: true }
);

// A student can apply to the same job only once
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, createdAt: -1 });

export const Application = model<IApplication>(
  "Application",
  applicationSchema
);