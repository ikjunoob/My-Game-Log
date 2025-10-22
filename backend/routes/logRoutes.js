// backend/routes/logRoutes.js
import express from "express";
import Log from "../models/Log.js";
import { protect } from "../middleware/authMiddleware.js";
import { deleteS3Object } from "../src/s3.js";

const router = express.Router();

// 생성: 프론트가 S3 업로드 후 메타만 전달
router.post("/", protect, async (req, res) => {
    try {
        const { game, date, result, notes, image, isPublic = true } = req.body;
        const doc = await Log.create({
            userId: req.user.id,
            game, date, result, notes,
            image: image || null,
            isPublic,
        });
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 내 로그 목록
router.get("/", protect, async (req, res) => {
    try {
        const logs = await Log.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 공개 피드 (비인증)
router.get("/public/feed", async (_req, res) => {
    try {
        const logs = await Log.find({ isPublic: true }).sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 수정 (텍스트/이미지 메타 교체)
router.patch("/:id", protect, async (req, res) => {
    try {
        const allow = ["game", "date", "result", "notes", "image", "isPublic"];
        const fields = {};
        allow.forEach((k) => {
            if (req.body[k] !== undefined) fields[k] = req.body[k];
        });

        // 이전 이미지가 있고, 새 image.key가 들어오면 교체 처리 시 S3에서 이전 파일 삭제 (선택)
        const prev = await Log.findOne({ _id: req.params.id, userId: req.user.id });
        if (!prev) return res.status(404).json({ message: "없거나 권한 없음" });

        // 이미지 교체 시 이전 S3 삭제
        const newKey = req.body?.image?.key;
        if (newKey && prev?.image?.key && prev.image.key !== newKey) {
            try { await deleteS3Object(prev.image.key); } catch { /* 무시 */ }
        }

        const updated = await Log.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            fields,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 삭제 (DB + S3)
router.delete("/:id", protect, async (req, res) => {
    try {
        const doc = await Log.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!doc) return res.status(404).json({ message: "없거나 권한 없음" });

        if (doc.image?.key) {
            try { await deleteS3Object(doc.image.key); } catch { /* 무시 */ }
        }
        res.json({ message: "삭제됨" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;

