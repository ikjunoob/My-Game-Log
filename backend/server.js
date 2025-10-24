import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import storageRoutes from "./routes/storageRoutes.js";

dotenv.config();
const app = express();

// ✅ 기본 미들웨어
app.use(cors({
    origin: process.env.FRONT_ORIGIN || "http://localhost:5173",
    credentials: true,
}));
app.use(express.json({ limit: "3mb" }));
app.use(cookieParser());

// ✅ DB 연결
connectDB();

// ✅ 라우트
app.use("/api/users", userRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/storage", storageRoutes);

// ✅ 404 처리
app.use((_req, res) => res.status(404).json({ message: "Not Found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
