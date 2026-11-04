import dns from "node:dns";
import mongoose from "mongoose";

// Use public DNS servers so the MongoDB Atlas address can be resolved
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in .env");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
};