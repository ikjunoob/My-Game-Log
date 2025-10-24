import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ 회원가입
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password)
            return res.status(400).json({ message: "아이디와 비밀번호가 필요합니다" });

        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ message: "이미 존재하는 회원입니다" });

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashed });
        res.status(201).json({
            message: "회원가입 성공",
            user: { id: user._id, username: user.username, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 로그인
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "존재하지 않는 회원입니다" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "비밀번호가 틀립니다" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "로그인 성공", token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 내 정보 조회
router.get("/me", protect, async (req, res) => {
    try {
        const me = await User.findById(req.user.id).select("-password");
        if (!me) return res.status(404).json({ message: "사용자 없음" });
        res.json(me);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
