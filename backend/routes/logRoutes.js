import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";

import Log from "../models/Log.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        // ⬇️ latin1 → utf8 변환 (한글 깨짐 방지)
        const originalUtf8 = Buffer.from(file.originalname, "latin1").toString("utf8");

        // 위험한 경로문자만 제거 (한글/영문/숫자는 보존)
        const ext = path.extname(originalUtf8);
        const name = path.basename(originalUtf8, ext).replace(/[\\/:*?"<>|]/g, ""); // Windows 예약문자 제거

        cb(null, `${Date.now()}-${name}${ext}`);
    },
});

const upload = multer({ storage });

// 업로드된 로컬 파일 경로 계산 유틸
const toLocalPath = (imageUrl) => {
    if (!imageUrl) return null;
    // "/uploads/xxx.png" -> "uploads/xxx.png"
    const rel = imageUrl.startsWith("/uploads/") ? imageUrl.slice(1) : imageUrl;
    return path.join(process.cwd(), rel);
};

// 기록 추가 (이미지 포함)
router.post("/", protect, upload.single("image"), async (req, res) => {
    try {
        const newLog = await Log.create({
            game: req.body.game,
            date: req.body.date,
            result: req.body.result,
            notes: req.body.notes,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        });
        res.status(201).json(newLog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 전체 기록 조회
router.get("/", protect, async (req, res) => {
    try {
        const logs = await Log.find();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 수정 (텍스트 + 이미지 교체 지원)
router.patch("/:id", protect, upload.single("image"), async (req, res) => {
    try {
        const log = await Log.findById(req.params.id);
        if (!log) return res.status(404).json({ message: "존재하지 않는 로그" });

        // 허용된 필드만 업데이트 (간단 화이트리스트)
        const fields = {};
        ["game", "date", "result", "notes"].forEach((k) => {
            if (req.body[k] !== undefined) fields[k] = req.body[k];
        });

        // 새 이미지가 업로드되면 기존 파일 삭제 후 교체
        if (req.file) {
            if (log.imageUrl) {
                const oldPath = toLocalPath(log.imageUrl);
                if (oldPath) {
                    try { await fs.unlink(oldPath); } catch { /* 없어도 무시 */ }
                }
            }
            fields.imageUrl = `/uploads/${req.file.filename}`;
        }

        const updated = await Log.findByIdAndUpdate(req.params.id, fields, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 삭제 (DB + 실제 파일 같이 삭제)
router.delete("/:id", protect, async (req, res) => {
    try {
        const removed = await Log.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ message: "이미 삭제되었거나 없음" });

        if (removed.imageUrl) {
            const filePath = toLocalPath(removed.imageUrl);
            if (filePath) {
                try { await fs.unlink(filePath); } catch { /* 이미 없을 수 있음 */ }
            }
        }

        res.json({ message: "삭제되었습니다" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
