import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// 회원가입
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ message: "이미 존재하는 회원입니다" });

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashed });
        res.status(201).json({ message: "회원가입이 완료되었습니다!", user });
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

export default router;
