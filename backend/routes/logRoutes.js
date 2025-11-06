import express from "express";
import Log from "../models/Log.js";
import { protect } from "../middleware/authMiddleware.js";
import { deleteS3Object } from "../src/s3.js";

const router = express.Router();
// ✅ [수정] 테스트를 위해 페이지당 2개로 설정
const ITEMS_PER_PAGE = 2;

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

// ✅ [수정] 내 로그 (페이지네이션 적용)
router.get("/", protect, async (req, res) => {
    try {
        const { page = 1, size = ITEMS_PER_PAGE } = req.query;
        const filter = { userId: req.user.id };

        const total = await Log.countDocuments(filter);
        const logs = await Log.find(filter)
            .sort({ createdAt: -1 }) // 최신순 정렬
            .skip((+page - 1) * +size)
            .limit(+size);

        // ✅ { logs, total } 객체로 응답
        // ✅ .reverse()는 프론트엔드에서 처리하도록 원본 순서(최신순)대로 보냅니다.
        res.json({ logs, total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ [수정] 내 로그 검색 (페이지네이션 적용)
router.get("/search", protect, async (req, res) => {
    try {
        const { q, from, to, page = 1, size = ITEMS_PER_PAGE } = req.query;
        const userId = req.user.id;

        const filter = { userId };
        if (q && q.trim()) {
            const rex = new RegExp(q.trim(), "i");
            filter.$or = [
                { game: rex },
                { result: rex },
                { notes: rex }
            ];
        }
        const dateFilter = {};
        if (from && from.trim()) {
            dateFilter.$gte = from.trim();
        }
        if (to && to.trim()) {
            dateFilter.$lte = to.trim();
        }
        if (Object.keys(dateFilter).length > 0) {
            filter.date = dateFilter;
        }

        const total = await Log.countDocuments(filter);
        const logs = await Log.find(filter)
            .sort({ createdAt: -1 })
            .skip((+page - 1) * +size)
            .limit(+size);

        res.json({ logs, total }); // ✅ { logs, total } 객체로 응답

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ 공개 피드 (페이지네이션 적용 - 이전 단계에서 수정됨)
router.get("/public/feed", async (req, res) => {
    try {
        const {
            game = "",
            mode = "",
            q = "",
            author = "",
            sort = "latest",
            page = 1,
            size = ITEMS_PER_PAGE // (2개)
        } = req.query;

        const pipeline = [
            { $match: { isPublic: true } },
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
        ];
        const and = [];

        if (game && game.trim()) and.push({ game: game.trim() });
        if (q && q.trim()) {
            const rex = new RegExp(q.trim(), "i");
            if (mode === "title") and.push({ result: rex });
            else if (mode === "content") and.push({ notes: rex });
            else if (mode === "title_content") and.push({ $or: [{ result: rex }, { notes: rex }] });
            else and.push({ $or: [{ game: rex }, { result: rex }, { notes: rex }] });
        }
        if (author && author.trim()) {
            const rex = new RegExp(author.trim(), "i");
            and.push({ "user.username": rex });
        }
        if (from || to) {
            const cond = {};
            if (from) cond.$gte = from;
            if (to) cond.$lte = to;
            and.push({ date: cond });
        }
        if (typeof isPublic !== "undefined" && isPublic !== "") {
            and.push({ isPublic: isPublic === "true" });
        }

        if (and.length) pipeline.push({ $match: { $and: and } });

        const countPipeline = [...pipeline, { $count: "total" }];
        const totalResult = await Log.aggregate(countPipeline);
        const total = totalResult[0]?.total || 0;

        if (sort === "likes") pipeline.push({ $sort: { likes: -1, createdAt: -1 } });
        else pipeline.push({ $sort: { createdAt: -1 } });

        pipeline.push({ $skip: (+page - 1) * +size });
        pipeline.push({ $limit: +size });

        const rows = await Log.aggregate(pipeline);
        const shapedLogs = rows.map((r) => ({ ...r, userId: r.user }));

        res.json({ logs: shapedLogs, total: total });

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

// 좋아요 토글
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