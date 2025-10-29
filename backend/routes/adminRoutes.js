// backend/routes/adminRoutes.js
import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Log from "../models/Log.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { deleteS3Object } from "../src/s3.js";

const router = express.Router();

/** =========================
 *  유저 검색/목록
 *  GET /api/admin/users
 *  ?q=키워드(아이디) &role=user|admin &from=YYYY-MM-DD &to=YYYY-MM-DD
 *  ========================= */
router.get("/users", protect, adminOnly, async (req, res) => {
    try {
        const { q = "", role = "", from = "", to = "" } = req.query;
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

        const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/** =========================
 *  전체 로그 검색/목록
 *  GET /api/admin/logs
 *  ?q=키워드(game|result|notes)
 *  &user=작성자아이디(부분/정확)  ← username 기준
 *  &from=YYYY-MM-DD &to=YYYY-MM-DD
 *  &isPublic=true|false
 *  ========================= */
router.get("/logs", protect, adminOnly, async (req, res) => {
    try {
        const { q = "", user = "", from = "", to = "", isPublic } = req.query;

        // 집계 파이프라인 (작성자 username 검색 지원)
        const pipeline = [
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
            if (from) cond.$gte = from; // Log.date 는 "YYYY-MM-DD" 문자열
            if (to) cond.$lte = to;
            and.push({ date: cond });
        }

        if (typeof isPublic !== "undefined" && isPublic !== "") {
            if (isPublic === "true" || isPublic === true) and.push({ isPublic: true });
            if (isPublic === "false" || isPublic === false) and.push({ isPublic: false });
        }

        if (and.length) pipeline.push({ $match: { $and: and } });

        pipeline.push({ $sort: { createdAt: -1 } });

        const logs = await Log.aggregate(pipeline);

        // populate와 같은 결과 형태로 맞추기(프론트에서 user.username 사용)
        const shaped = logs.map((l) => ({
            ...l,
            userId: l.user._id,
            user, // remove? keep original
        }));

        res.json(
            logs.map((doc) => ({
                ...doc,
                userId: doc.user, // user 전체 객체를 userId에 담아 프론트 호환
            }))
        );
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/** =========================
 *  특정 로그 삭제 (DB + S3)
 *  DELETE /api/admin/logs/:id
 *  ========================= */
router.delete("/logs/:id", protect, adminOnly, async (req, res) => {
    try {
        const removed = await Log.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ message: "해당 로그를 찾을 수 없습니다" });

        if (removed.image?.key) {
            try {
                await deleteS3Object(removed.image.key);
            } catch {
                /* S3에 없을 수 있음 */
            }
        }
        res.json({ message: "관리자에 의해 로그가 삭제되었습니다" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
