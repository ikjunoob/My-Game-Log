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

// ✅ 내 로그 검색
// GET /api/logs/search?q=키워드&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/search", protect, async (req, res) => {
    try {
        const { q = "", from = "", to = "" } = req.query;

        const filter = { userId: req.user.id };

        // 키워드(게임명/결과/메모) — 부분일치(대소문자 무시)
        if (q && String(q).trim()) {
            const rex = new RegExp(String(q).trim(), "i");
            filter.$or = [{ game: rex }, { result: rex }, { notes: rex }];
            // 텍스트 인덱스를 적극 활용하려면 아래와 같이도 가능 (점수 정렬 등)
            // filter.$text = { $search: String(q).trim() };
        }

        // 날짜 범위 필터 (문자열 ISO 비교)
        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = from;
            if (to) filter.date.$lte = to;
        }

        const logs = await Log.find(filter).sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
