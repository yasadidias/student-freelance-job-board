import "dotenv/config";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { connectDB } from "./config/db";
import { errorHandler, notFound } from "./middleware/errorHandler";
import adminRoutes from "./routes/admin.routes";
import aiRoutes from "./routes/ai.routes";
import applicationRoutes from "./routes/application.routes";
import authRoutes from "./routes/auth.routes";
import jobRoutes from "./routes/job.routes";
import userRoutes from "./routes/user.routes";

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

// Render runs behind a proxy, so trust the first one (needed for rate limiting)
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    // CLIENT_URL can hold several origins separated by commas
    origin: (process.env.CLIENT_URL ?? "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),
  })
);
app.use(express.json({ limit: "100kb" }));

// Slow down brute-force attacks on login/register and protect the AI quota
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later" },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests, slow down" },
});

app.get("/", (_req, res) => {
  res.json({ success: true, message: "Student Freelance Job Board API is running" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error: unknown) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });