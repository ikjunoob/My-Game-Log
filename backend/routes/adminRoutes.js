import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Log from "../models/Log.js";
// 'adminOnly' 미들웨어 이름은 실제 파일에 맞게 확인해주세요.
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { deleteS3Object } from "../src/s3.js";

const router = express.Router();
const ITEMS_PER_PAGE = 2; // 테스트용 2개

/** =========================
 * 유저 검색/목록 (페이지네이션 적용)
 * ========================= */
router.get("/users", protect, adminOnly, async (req, res) => {
    try {
        // ✅ [디버깅] 1. 프론트엔드에서 보낸 쿼리 파라미터 전체를 터미널에 출력
        console.log("GET /api/admin/users 쿼리:", req.query);

        const { q = "", role = "", from = "", to = "", page = 1, size = ITEMS_PER_PAGE } = req.query;
        const filter = {};

        if (q && q.trim()) {
            filter.username = new RegExp(q.trim(), "i");
        }
        if (role && (role === "user" || role === "admin")) {
            filter.role = role;
        }
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
            if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip((+page - 1) * +size)
            .limit(+size);

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

        const { q = "", user = "", from = "", to = "", isPublic, page = 1, size = ITEMS_PER_PAGE } = req.query;

        const pipeline = [
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
        ];
        const and = [];

        if (q && q.trim()) {
            const rex = new RegExp(q.trim(), "i");
            and.push({ $or: [{ game: rex }, { result: rex }, { notes: rex }] });
        }
        if (user && user.trim()) {
            const rexUser = new RegExp(user.trim(), "i");
            and.push({ "user.username": rexUser });
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

        const dataPipeline = [
            ...pipeline,
            { $sort: { createdAt: -1 } },
            { $skip: (+page - 1) * +size },
            { $limit: +size }
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
        const removed = await Log.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ message: "해당 로그를 찾을 수 없습니다" });

        if (removed.image?.key) {
            try {
                await deleteS3Object(removed.image.key);
            } catch { /* S3에 없을 수 있음 */ }
        }
        res.json({ message: "관리자에 의해 로그가 삭제되었습니다" });
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

        // 사용자의 로그 모두 삭제 + S3 정리
        const logs = await Log.find({ userId: uid });
        for (const l of logs) {
            if (l.image?.key) { try { await deleteS3Object(l.image.key); } catch { } }
        }
        await Log.deleteMany({ userId: uid });

        // 유저 삭제
        const gone = await User.findByIdAndDelete(uid);
        if (!gone) return res.status(404).json({ message: "유저 없음" });

        res.json({ message: "강제탈퇴 완료" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;