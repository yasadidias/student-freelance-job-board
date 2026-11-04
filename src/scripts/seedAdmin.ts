import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User, UserRole } from "../models/user.model";

// Creates the first ADMIN account (admins cannot register through the website).
// Run with:  npm run seed:admin
const run = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log("Admin already exists:", existing.email);
  } else {
    await User.create({
      name: "Admin",
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: UserRole.ADMIN,
    });
    console.log("Admin created:", email);
  }
  await mongoose.disconnect();
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});