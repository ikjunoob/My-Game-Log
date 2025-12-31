import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Log from "../models/Log.js";
import DeletionLog from "../models/DeletionLog.js";
// 'adminOnly' 미들웨어 이름은 실제 파일에 맞게 확인해주세요.
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { deleteS3Object } from "../src/s3.js";
import { recordDeletion } from "../utils/audit.js";
import { isValidDateString, normalizePagination, trimString } from "../utils/validation.js";

const router = express.Router();
const ITEMS_PER_PAGE = 2; // 테스트용 2개

/** =========================
 * 유저 검색/목록 (페이지네이션 적용)
 * ========================= */
router.get("/users", protect, adminOnly, async (req, res) => {
    try {
        // ✅ [디버깅] 1. 프론트엔드에서 보낸 쿼리 파라미터 전체를 터미널에 출력
        console.log("GET /api/admin/users 쿼리:", req.query);

        const q = trimString(req.query.q, 50);
        const role = trimString(req.query.role, 10);
        const from = trimString(req.query.from, 10);
        const to = trimString(req.query.to, 10);
        const { page, size } = normalizePagination(req.query.page, req.query.size, {
            defaultSize: ITEMS_PER_PAGE,
            maxSize: 50,
        });
        const filter = {};

        if (q) {
            filter.username = new RegExp(q, "i");
        }
        if (role && (role === "user" || role === "admin")) {
            filter.role = role;
        }
        if (from || to) {
            filter.createdAt = {};
            if (from) {
                if (!isValidDateString(from)) {
                    return res.status(400).json({ message: "Invalid date format." });
                }
                filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
            }
            if (to) {
                if (!isValidDateString(to)) {
                    return res.status(400).json({ message: "Invalid date format." });
                }
                filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
            }
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip((page - 1) * size)
            .limit(size);

        res.json({ users, total });

    } catch (err) {
        console.error("GET /api/admin/users 오류:", err); // ✅ 에러 로그 추가
        res.status(500).json({ message: err.message });
    }
});

/** =========================
 * 전체 로그 검색/목록 (페이지네이션 적용)
 * ========================= */
router.get("/logs", protect, adminOnly, async (req, res) => {
    try {
        // ✅ [디버깅] 1. 프론트엔드에서 보낸 쿼리 파라미터 전체를 터미널에 출력
        console.log("GET /api/admin/logs 쿼리:", req.query);

        const q = trimString(req.query.q, 100);
        const user = trimString(req.query.user, 50);
        const from = trimString(req.query.from, 10);
        const to = trimString(req.query.to, 10);
        const isPublic = req.query.isPublic;
        const { page, size } = normalizePagination(req.query.page, req.query.size, {
            defaultSize: ITEMS_PER_PAGE,
            maxSize: 50,
        });

/** =========================
 * backup export (json)
 * GET /api/admin/backup?type=users|logs|deletions|all
 * ========================= */
router.get("/backup", protect, adminOnly, async (req, res) => {
    try {
        const type = trimString(req.query.type, 20) || "all";
        const allowed = new Set(["all", "users", "logs", "deletions"]);
        if (!allowed.has(type)) {
            return res.status(400).json({ message: "Invalid backup type." });
        }
        const includeUsers = type === "all" || type === "users";
        const includeLogs = type === "all" || type === "logs";
        const includeDeletions = type === "all" || type === "deletions";

        const payload = {
            meta: {
                exportedAt: new Date().toISOString(),
                type,
            },
            data: {},
        };

        if (includeUsers) {
            payload.data.users = await User.find({}).select("-password").lean();
        }
        if (includeLogs) {
            payload.data.logs = await Log.find({}).lean();
        }
        if (includeDeletions) {
            payload.data.deletions = await DeletionLog.find({}).lean();
        }

        const safeStamp = payload.meta.exportedAt.replace(/[:.]/g, "-");
        const fileName = `backup-${safeStamp}.json`;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.status(200).send(JSON.stringify(payload));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

        const pipeline = [
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
        ];
        const and = [];

        if (q) {
            const rex = new RegExp(q, "i");
            and.push({ $or: [{ game: rex }, { result: rex }, { notes: rex }] });
        }
        if (user) {
            const rexUser = new RegExp(user, "i");
            and.push({ "user.username": rexUser });
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
        if (typeof isPublic !== "undefined" && isPublic !== "") {
            and.push({ isPublic: isPublic === "true" });
        }

        if (and.length) pipeline.push({ $match: { $and: and } });

        const countPipeline = [...pipeline, { $count: "total" }];
        const totalResult = await Log.aggregate(countPipeline);
        const total = totalResult[0]?.total || 0;

        const dataPipeline = [
            ...pipeline,
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * size },
            { $limit: size }
        ];

        const logs = await Log.aggregate(dataPipeline);

        // ✅ [디버깅] 2. skip/limit 적용 후 찾은 로그 개수 출력
        console.log(`페이지: ${page}, 찾은 로그 개수: ${logs.length} / 전체: ${total}`);

        const shapedLogs = logs.map((doc) => ({ ...doc, userId: doc.user }));
        res.json({ logs: shapedLogs, total });

    } catch (err) {
        console.error("GET /api/admin/logs 오류:", err); // ✅ 에러 로그 추가
        res.status(500).json({ message: err.message });
    }
});

/** =========================
 * 특정 로그 삭제 (DB + S3)
 * DELETE /api/admin/logs/:id
 * ========================= */
router.delete("/logs/:id", protect, adminOnly, async (req, res) => {
    try {
        const removed = await Log.findById(req.params.id);
        if (!removed) return res.status(404).json({ message: "Log not found." });

        await Log.deleteOne({ _id: removed._id });
        await recordDeletion({
            actorId: req.user.id,
            actorRole: req.user.role,
            targetType: "log",
            target: removed,
            meta: { source: "admin" },
        });

        if (removed.image?.key) {
            try {
                await deleteS3Object(removed.image.key);
            } catch { /* ignore */ }
        }
        res.json({ message: "Admin deleted log." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/** =========================
 * 특정 유저 강제 탈퇴 (User + Logs + S3)
 * DELETE /api/admin/users/:id
 * ========================= */
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
    try {
        const uid = req.params.id;
        const user = await User.findById(uid);
        if (!user) return res.status(404).json({ message: "User not found." });

        const logs = await Log.find({ userId: uid });
        for (const l of logs) {
            if (l.image?.key) { try { await deleteS3Object(l.image.key); } catch { } }
        }
        await Log.deleteMany({ userId: uid });

        await User.findByIdAndDelete(uid);

        await recordDeletion({
            actorId: req.user.id,
            actorRole: req.user.role,
            targetType: "user",
            target: user,
            meta: { logsDeleted: logs.length, source: "admin" },
        });

        res.json({ message: "Admin deleted user." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
