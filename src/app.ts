import "dotenv/config";
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import securityRoutes from "./routes/securityRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import divisionRoutes from "./routes/divisionRoutes";
import { errorHandler } from "./middlewares/errorMiddleware";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:3000,http://10.59.72.230:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

console.log("Hello");
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/divisions", divisionRoutes);

app.use(errorHandler);

export default app;
