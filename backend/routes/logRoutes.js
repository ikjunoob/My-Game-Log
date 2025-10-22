import express from "express";
import multer from "multer";
import Log from "../models/Log.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// 기록 추가
router.post("/", protect, upload.single("image"), async (req, res) => {
    try {
        const newLog = await Log.create({
            game: req.body.game,
            date: req.body.date,
            result: req.body.result,
            notes: req.body.notes,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null
        });
        res.status(201).json(newLog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 전체 기록 조회
router.get("/", protect, async (req, res) => {
    try {
        const logs = await Log.find();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 수정
router.patch("/:id", protect, async (req, res) => {
    try {
        const updated = await Log.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "존재하지 않는 로그" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 삭제
router.delete("/:id", protect, async (req, res) => {
    try {
        const removed = await Log.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ message: "이미 삭제되었거나 없음" });
        res.json({ message: "삭제되었습니다" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
