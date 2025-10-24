import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// 회원가입
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: "필수 정보 누락" });

        const exists = await User.findOne({ username });
        if (exists) return res.status(400).json({ message: "이미 존재하는 사용자" });

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashed });
        res.status(201).json({ id: user._id, username: user.username });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// 로그인
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "사용자를 찾을 수 없습니다" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: "비밀번호가 일치하지 않습니다" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// 내 정보
router.get("/me", protect, async (req, res) => {
    const me = await User.findById(req.user.id).select("-password");
    res.json(me);
});

export default router;
