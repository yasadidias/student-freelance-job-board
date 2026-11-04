import { Document, Schema, model } from "mongoose";

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
}

// Days used by the weekly "free time" timetable
export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type Day = (typeof DAYS)[number];

// One cell of the timetable: e.g. { day: "MON", hour: 16 } means Monday 4pm-5pm
export interface IAvailabilitySlot {
  day: Day;
  hour: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isBlocked: boolean;
  availability: IAvailabilitySlot[];
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new Schema<IAvailabilitySlot>(
  {
    day: { type: String, enum: DAYS, required: true },
    hour: { type: Number, min: 0, max: 23, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);