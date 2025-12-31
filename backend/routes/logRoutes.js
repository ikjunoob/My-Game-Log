// backend/routes/logRoutes.js
import express from "express";
import Log from "../models/Log.js";
import { protect } from "../middleware/authMiddleware.js";
import { deleteS3Object } from "../src/s3.js";
import { cooldown } from "../middleware/cooldown.js";
import { recordDeletion } from "../utils/audit.js";
import {
    coerceBoolean,
    isValidDateString,
    normalizePagination,
    trimString,
} from "../utils/validation.js";

const router = express.Router();
// ✅ 테스트를 위해 페이지당 2개로 설정
const ITEMS_PER_PAGE = 2;

// 로그 생성: 입력 검증 + 쿨다운 적용.
router.post(
    "/",
    protect,
    cooldown({
        keyFn: (req) => req.user?.id || req.ip,
        message: "Please wait before creating another log.",
    }),
    async (req, res) => {
        try {
            const game = trimString(req.body?.game, 50);
            const date = trimString(req.body?.date, 10);
            const result = trimString(req.body?.result, 100);
            const notes = trimString(req.body?.notes, 2000);
            const isPublic =
                req.body?.isPublic === undefined
                    ? true
                    : coerceBoolean(req.body?.isPublic, null);

            if (!game || !date || !result) {
                return res.status(400).json({ message: "Invalid log data." });
            }
            if (!isValidDateString(date)) {
                return res.status(400).json({ message: "Invalid date format." });
            }
            if (isPublic === null) {
                return res.status(400).json({ message: "Invalid isPublic value." });
            }

            let image = null;
            if (req.body?.image === null) {
                image = null;
            } else if (req.body?.image && typeof req.body.image === "object") {
                const key = trimString(req.body.image.key, 200);
                const url = trimString(req.body.image.url, 500);
                if (key || url) image = { key, url };
            }
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
    }
);

// ✅ [수정] 내 로그 (페이지네이션 적용)
// 내 로그 목록 조회(페이지네이션).
router.get("/", protect, async (req, res) => {
    try {
        const { page, size } = normalizePagination(req.query.page, req.query.size, {
            defaultSize: ITEMS_PER_PAGE,
            maxSize: 50,
        });
        const filter = { userId: req.user.id };

        const total = await Log.countDocuments(filter);
        const logs = await Log.find(filter)
            .sort({ createdAt: -1 }) // 최신순 정렬
            .skip((page - 1) * size)
            .limit(size);

        res.json({ logs, total }); // ✅ { logs, total } 객체로 응답
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ [수정] 내 로그 검색 (페이지네이션 적용)
// 내 로그 검색(페이지네이션).
router.get("/search", protect, async (req, res) => {
    try {
        const q = trimString(req.query.q, 100);
        const from = trimString(req.query.from, 10);
        const to = trimString(req.query.to, 10);
        const { page, size } = normalizePagination(req.query.page, req.query.size, {
            defaultSize: ITEMS_PER_PAGE,
            maxSize: 50,
        });
        const userId = req.user.id;

        const filter = { userId };
        if (q) {
            const rex = new RegExp(q, "i");
            filter.$or = [{ game: rex }, { result: rex }, { notes: rex }];
        }
        const dateFilter = {};
        if (from) {
            if (!isValidDateString(from)) {
                return res.status(400).json({ message: "Invalid date format." });
            }
            dateFilter.$gte = from;
        }
        if (to) {
            if (!isValidDateString(to)) {
                return res.status(400).json({ message: "Invalid date format." });
            }
            dateFilter.$lte = to;
        }
        if (Object.keys(dateFilter).length > 0) {
            filter.date = dateFilter;
        }

        const total = await Log.countDocuments(filter);
        const logs = await Log.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * size)
            .limit(size);

        res.json({ logs, total }); // ✅ { logs, total } 객체로 응답
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/** =========================
 * ✅ 공개 피드 (페이지네이션 $facet으로 수정)
 * ========================= */
router.get("/public/feed", async (req, res) => {
    try {
        const game = trimString(req.query.game, 50);
        const mode = trimString(req.query.mode, 20);
        const q = trimString(req.query.q, 100);
        const author = trimString(req.query.author, 50);
        const sort = trimString(req.query.sort, 20);
        const from = trimString(req.query.from, 10);
        const to = trimString(req.query.to, 10);
        const isPublic = req.query.isPublic;
        const { page: pageNum, size: sizeNum } = normalizePagination(
            req.query.page,
            req.query.size,
            { defaultSize: ITEMS_PER_PAGE, maxSize: 50 }
        );

        // 1) 기본 필터링 파이프라인
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
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

            // 🔒 민감 필드 제거 (여기에서 바로 정리)
            { $unset: ["user.password", "user.__v", "user.createdAt", "user.updatedAt"] },
        ];

        const and = [];

        if (game) and.push({ game });

        if (q) {
            const rex = new RegExp(q, "i");
            if (mode === "title") and.push({ result: rex });
            else if (mode === "content") and.push({ notes: rex });
            else if (mode === "title_content") and.push({ $or: [{ result: rex }, { notes: rex }] });
            else and.push({ $or: [{ game: rex }, { result: rex }, { notes: rex }] });
        }

        if (author) {
            const rex = new RegExp(author, "i");
            and.push({ "user.username": rex });
        }

        if (from || to) {
            const cond = {};
            if (from) {
                if (!isValidDateString(from)) {
                    return res.status(400).json({ message: "Invalid date format." });
                }
                cond.$gte = from;
            }
            if (to) {
                if (!isValidDateString(to)) {
                    return res.status(400).json({ message: "Invalid date format." });
                }
                cond.$lte = to;
            }
            and.push({ date: cond });
        }

        // 쿼리로 false를 명시했을 때만 false 조건 추가 (기본은 true)
        if (String(isPublic).length && String(isPublic).toLowerCase() === "false") {
            and.push({ isPublic: false });
        }

        if (and.length) pipeline.push({ $match: { $and: and } });

        const sortStage =
            sort === "likes" ? { $sort: { likes: -1, createdAt: -1 } } : { $sort: { createdAt: -1 } };

        const facetPipeline = [
            ...pipeline,
            {
                $facet: {
                    total: [{ $count: "count" }],
                    pageData: [sortStage, { $skip: (pageNum - 1) * sizeNum }, { $limit: sizeNum }],
                },
            },
        ];

        const results = await Log.aggregate(facetPipeline);

        const logsData = results[0]?.pageData || [];
        const total = results[0]?.total?.[0]?.count || 0;

        // 프론트 호환: userId에 user 객체 실어주기
        const shapedLogs = logsData.map((r) => ({ ...r, userId: r.user }));

        res.json({ logs: shapedLogs, total });
    } catch (err) {
        console.error("GET /api/logs/public/feed 오류:", err);
        res.status(500).json({ message: err.message });
    }
});

// 수정
// 로그 수정(허용 필드만 업데이트).
router.patch("/:id", protect, async (req, res) => {
    try {
        const fields = {};
        if (req.body?.game !== undefined) {
            const game = trimString(req.body.game, 50);
            if (!game) return res.status(400).json({ message: "Invalid game value." });
            fields.game = game;
        }
        if (req.body?.date !== undefined) {
            const date = trimString(req.body.date, 10);
            if (!isValidDateString(date)) {
                return res.status(400).json({ message: "Invalid date format." });
            }
            fields.date = date;
        }
        if (req.body?.result !== undefined) {
            const result = trimString(req.body.result, 100);
            if (!result) return res.status(400).json({ message: "Invalid result value." });
            fields.result = result;
        }
        if (req.body?.notes !== undefined) {
            fields.notes = trimString(req.body.notes, 2000);
        }
        if (req.body?.isPublic !== undefined) {
            const isPublic = coerceBoolean(req.body.isPublic, null);
            if (isPublic === null) {
                return res.status(400).json({ message: "Invalid isPublic value." });
            }
            fields.isPublic = isPublic;
        }
        if (req.body?.image !== undefined) {
            if (req.body.image === null) {
                fields.image = null;
            } else if (req.body.image && typeof req.body.image === "object") {
                const key = trimString(req.body.image.key, 200);
                const url = trimString(req.body.image.url, 500);
                fields.image = key || url ? { key, url } : null;
            } else {
                return res.status(400).json({ message: "Invalid image value." });
            }
        }

        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ message: "No valid fields to update." });
        }

        const prev = await Log.findOne({ _id: req.params.id, userId: req.user.id });
        if (!prev) return res.status(404).json({ message: "Not found or unauthorized." });

        const newKey = fields.image?.key;
        if (req.body?.image !== undefined && prev?.image?.key && prev.image.key !== newKey) {
            try {
                await deleteS3Object(prev.image.key);
            } catch { }
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
// 로그 삭제 + 삭제 로그 기록.
router.delete("/:id", protect, async (req, res) => {
    try {
        const doc = await Log.findOne({ _id: req.params.id, userId: req.user.id });
        if (!doc) return res.status(404).json({ message: "Not found or unauthorized." });

        await Log.deleteOne({ _id: doc._id });
        await recordDeletion({
            actorId: req.user.id,
            actorRole: req.user.role,
            targetType: "log",
            target: doc,
        });

        if (doc.image?.key) {
            try {
                await deleteS3Object(doc.image.key);
            } catch { }
        }
        res.json({ message: "Deleted." });
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
