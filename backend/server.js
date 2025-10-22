// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import storageRoutes from "./routes/storageRoutes.js";

dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.FRONT_ORIGIN, // 예: http://localhost:5173
    credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// (로컬 multer 쓸 때만 필요) 정적 폴더 제공
// app.use("/uploads", express.static("uploads"));

connectDB();

app.use("/api/users", userRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/storage", storageRoutes);

// 404
app.use((_req, res) => res.status(404).json({ message: "Not Found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server on : ${PORT}`));

