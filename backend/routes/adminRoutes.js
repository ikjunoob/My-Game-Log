import express from "express";
import User from "../models/User.js";
import Log from "../models/Log.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 모든 유저 보기
router.get("/users", protect, adminOnly, async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// 모든 로그 보기
router.get("/logs", protect, adminOnly, async (req, res) => {
    const logs = await Log.find();
    res.json(logs);
});

// 특정 로그 삭제
router.delete("/logs/:id", protect, adminOnly, async (req, res) => {
    await Log.findByIdAndDelete(req.params.id);
    res.json({ message: "Log deleted by admin" });
});

export default router;
