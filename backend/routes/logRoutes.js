import express from "express";
import Log from "../models/Log.js";
import { protect } from "../middleware/authMiddleware.js";
// (삭제/수정 시 S3 삭제가 필요하면 DeleteObject도 유틸로 준비)

const router = express.Router();

// 생성: 프론트가 먼저 S3에 PUT 업로드 → 여기엔 메타만 전달
router.post("/", protect, async (req, res) => {
    try {
        const { game, date, result, notes, image, isPublic = true } = req.body;
        // image: { key, url }
        const doc = await Log.create({
            userId: req.user.id,
            game, date, result, notes,
            image: image || null,
            isPublic
        });
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 내 로그(소유권)
router.get("/", protect, async (req, res) => {
    const logs = await Log.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(logs);
});

// 공개 피드(누구나) — 최신순
router.get("/public/feed", async (_req, res) => {
    const logs = await Log.find({ isPublic: true }).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
});

// 수정(소유권 + 이미지 메타 교체 지원)
router.patch("/:id", protect, async (req, res) => {
    const allow = ["game", "date", "result", "notes", "image", "isPublic"];
    const fields = {};
    allow.forEach(k => { if (req.body[k] !== undefined) fields[k] = req.body[k]; });

    const updated = await Log.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id }, // 소유권 체크
        fields,
        { new: true }
    );
    if (!updated) return res.status(404).json({ message: "없거나 권한 없음" });
    res.json(updated);
});

// 삭제(소유권) — S3 object도 삭제 권장
router.delete("/:id", protect, async (req, res) => {
    const doc = await Log.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ message: "없거나 권한 없음" });

    // S3 파일도 제거하려면 deleteObject 호출 (key가 있을 때)
    // await deleteS3Object(doc.image?.key);

    res.json({ message: "삭제됨" });
});

export default router;

