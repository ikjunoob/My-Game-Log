// backend/routes/logRoutes.js
import express from "express";
import Log from "../models/Log.js";
import { protect } from "../middleware/authMiddleware.js";
import { deleteS3Object } from "../src/s3.js";

const router = express.Router();

// 생성
router.post("/", protect, async (req, res) => {
    try {
        const { game, date, result, notes, image, isPublic = true } = req.body;
        const doc = await Log.create({
            userId: req.user.id, game, date, result, notes, image: image || null, isPublic,
        });
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 내 로그
router.get("/", protect, async (req, res) => {
    try {
        const logs = await Log.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 공개 피드 (검색 + 정렬 + 작성자명 포함)
// GET /api/logs/public/feed?game=&mode=title|content|title_content&q=&author=&sort=latest|likes
router.get("/public/feed", async (req, res) => {
    try {
        const { game = "", mode = "", q = "", author = "", sort = "latest" } = req.query;

        const pipeline = [
            { $match: { isPublic: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
        ];

        const and = [];

        if (game && game.trim()) {
            and.push({ game: game.trim() });
        }

        if (q && q.trim()) {
            const rex = new RegExp(q.trim(), "i");
            if (mode === "title") and.push({ result: rex });
            else if (mode === "content") and.push({ notes: rex });
            else if (mode === "title_content") and.push({ $or: [{ result: rex }, { notes: rex }] });
            else {
                // 기본: game/result/notes 전체
                and.push({ $or: [{ game: rex }, { result: rex }, { notes: rex }] });
            }
        }

        if (author && author.trim()) {
            const rex = new RegExp(author.trim(), "i");
            and.push({ "user.username": rex });
        }

        if (and.length) pipeline.push({ $match: { $and: and } });

        // 정렬
        if (sort === "likes") pipeline.push({ $sort: { likes: -1, createdAt: -1 } });
        else pipeline.push({ $sort: { createdAt: -1 } });

        // 최대 200
        pipeline.push({ $limit: 200 });

        const rows = await Log.aggregate(pipeline);
        // 프론트 호환: userId에 user 객체 실어주기
        const shaped = rows.map((r) => ({ ...r, userId: r.user }));
        res.json(shaped);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 수정
router.patch("/:id", protect, async (req, res) => {
    try {
        const allow = ["game", "date", "result", "notes", "image", "isPublic"];
        const fields = {};
        allow.forEach((k) => { if (req.body[k] !== undefined) fields[k] = req.body[k]; });

        const prev = await Log.findOne({ _id: req.params.id, userId: req.user.id });
        if (!prev) return res.status(404).json({ message: "없거나 권한 없음" });

        const newKey = req.body?.image?.key;
        if (newKey && prev?.image?.key && prev.image.key !== newKey) {
            try { await deleteS3Object(prev.image.key); } catch { }
        }

        const updated = await Log.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id }, fields, { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 삭제
router.delete("/:id", protect, async (req, res) => {
    try {
        const doc = await Log.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!doc) return res.status(404).json({ message: "없거나 권한 없음" });
        if (doc.image?.key) { try { await deleteS3Object(doc.image.key); } catch { } }
        res.json({ message: "삭제됨" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 좋아요 토글
// POST /api/logs/:id/like  (보내줄 바디 없음)
router.post("/:id/like", protect, async (req, res) => {
    try {
        const log = await Log.findById(req.params.id);
        if (!log || !log.isPublic) return res.status(404).json({ message: "없거나 비공개" });

        const uid = req.user.id;
        const already = log.likedBy.some((x) => String(x) === String(uid));
        if (already) {
            log.likedBy = log.likedBy.filter((x) => String(x) !== String(uid));
            log.likes = Math.max(0, (log.likes || 0) - 1);
        } else {
            log.likedBy.push(uid);
            log.likes = (log.likes || 0) + 1;
        }
        await log.save();
        res.json({ likes: log.likes, liked: !already });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
