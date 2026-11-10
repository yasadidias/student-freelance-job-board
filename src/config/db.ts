import dns from "node:dns";
import mongoose from "mongoose";

// Some ISP DNS servers cannot resolve MongoDB Atlas SRV records, so use public DNS.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Keep one shared connection promise so serverless hosts (Vercel) reuse the
// same connection instead of opening a new one on every request.
let connecting: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in .env");
  }

  if (!connecting) {
    connecting = mongoose.connect(uri).catch((error: unknown) => {
      connecting = null;
      throw error;
    });
    await connecting;
    console.log("MongoDB connected");
    return;
  }
  await connecting;
};