// backend/routes/userRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js"; // ⬅️ 추가

const router = express.Router();

// 회원가입
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ message: "이미 존재하는 회원입니다" });

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashed });

        // (선택) 응답에서 비밀번호 제거
        const safeUser = { id: user._id, username: user.username, role: user.role };
        res.status(201).json({ message: "회원가입이 완료되었습니다!", user: safeUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 로그인
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "유저를 찾을 수 없습니다" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "잘못된 비밀번호입니다" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "로그인 성공!", token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 내 정보 조회 (/api/users/me)
router.get("/me", protect, async (req, res) => {
    try {
        // protect가 req.user.id를 채워줌
        const me = await User.findById(req.user.id).select("-password");
        if (!me) return res.status(404).json({ message: "사용자 없음" });

        res.status(200).json({
            id: me._id,
            username: me.username,
            role: me.role,
            createdAt: me.createdAt,
            updatedAt: me.updatedAt,
        });
    } catch (error) {
        res.status(401).json({ message: "토큰 무효", error: error.message });
    }
});

export default router;
