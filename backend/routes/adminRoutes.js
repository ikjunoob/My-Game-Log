// backend/routes/adminRoutes.js
import express from "express";
import User from "../models/User.js";
import Log from "../models/Log.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 모든 유저 보기
router.get("/users", protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find().select("-password"); // 해시 제외
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 모든 로그 보기
router.get("/logs", protect, adminOnly, async (req, res) => {
    try {
        const logs = await Log.find();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 특정 로그 삭제
router.delete("/logs/:id", protect, adminOnly, async (req, res) => {
    try {
        const removed = await Log.findByIdAndDelete(req.params.id);
        if (!removed) {
            return res.status(404).json({ message: "해당 로그를 찾을 수 없습니다" });
        }
        res.json({ message: "관리자에 의해 로그가 삭제되었습니다" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
