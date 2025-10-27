import express from "express";
import Log from "../models/Log.js";
import { protect } from "../middleware/authMiddleware.js";
import { deleteS3Object } from "../src/s3.js";

const router = express.Router();

// ✅ 로그 생성
router.post("/", protect, async (req, res) => {
    try {
        const { game, date, result, notes, image, isPublic = true } = req.body;
        const doc = await Log.create({
            userId: req.user.id,
            game,
            date,
            result,
            notes,
            image,
            isPublic,
        });
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 내 로그 목록
router.get("/", protect, async (req, res) => {
    try {
        const logs = await Log.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 공개 피드
router.get("/public/feed", async (_req, res) => {
    try {
        const logs = await Log.find({ isPublic: true })
            .sort({ createdAt: -1 })
            .limit(100)
            .select("game date result notes image createdAt userId")
            .populate("userId", "username"); // 작성자 이름 포함
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 로그 수정
router.patch("/:id", protect, async (req, res) => {
    try {
        const allow = ["game", "date", "result", "notes", "image", "isPublic"];
        const fields = {};
        for (const k of allow) if (req.body[k] !== undefined) fields[k] = req.body[k];

        const prev = await Log.findOne({ _id: req.params.id, userId: req.user.id });
        if (!prev) return res.status(404).json({ message: "없거나 권한 없음" });

        // S3 이미지 교체 시 기존 삭제
        if (req.body?.image?.key && prev.image?.key && prev.image.key !== req.body.image.key) {
            try { await deleteS3Object(prev.image.key); } catch { }
        }

        const updated = await Log.findByIdAndUpdate(req.params.id, fields, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 로그 삭제
router.delete("/:id", protect, async (req, res) => {
    try {
        const doc = await Log.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!doc) return res.status(404).json({ message: "없거나 권한 없음" });
        if (doc.image?.key) await deleteS3Object(doc.image.key);
        res.json({ message: "삭제 완료" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
