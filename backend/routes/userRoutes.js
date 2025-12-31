import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { cooldown } from "../middleware/cooldown.js";
import { trimString } from "../utils/validation.js";

const router = express.Router();

// ✅ 회원가입
router.post(
    "/register",
    cooldown({
        keyFn: (req) => req.ip,
        message: "Please wait before trying again.",
    }),
    async (req, res) => {
        const username = trimString(req.body?.username, 20);
        const password = typeof req.body?.password === "string" ? req.body.password : "";
        try {
            if (!username || !password) {
                return res.status(400).json({ message: "Username and password are required." });
            }
            if (username.length < 3) {
                return res.status(400).json({ message: "Username must be at least 3 characters." });
            }
            if (password.length < 8 || password.length > 64) {
                return res.status(400).json({ message: "Password must be 8-64 characters." });
            }

            const existing = await User.findOne({ username });
            if (existing) return res.status(400).json({ message: "Username already exists." });

            const hashed = await bcrypt.hash(password, 10);
            const user = await User.create({ username, password: hashed });
            res.status(201).json({
                message: "Registered successfully.",
                user: { id: user._id, username: user.username, role: user.role },
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// ✅ 로그인
router.post("/login", async (req, res) => {
    const username = trimString(req.body?.username, 20);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    try {
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "Invalid credentials." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "Logged in.", token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 내 정보 조회
router.get("/me", protect, async (req, res) => {
    try {
        const me = await User.findById(req.user.id).select("-password");
        if (!me) return res.status(404).json({ message: "User not found." });
        res.json(me);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
