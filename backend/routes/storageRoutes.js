import express from "express";
import { presignPut } from "../src/s3.js"; // 네 파일 경로에 맞게
const router = express.Router();

// POST /api/storage/presign { filename, contentType }
// -> { key, uploadUrl, viewUrl }
router.post("/presign", async (req, res) => {
    try {
        const { filename, contentType } = req.body;
        if (!filename || !contentType) {
            return res.status(400).json({ message: "filename/contentType 필요" });
        }

        // 한글 파일명 안전 처리 + 키 설계
        const ts = Date.now();
        const safe = filename.replace(/[\\/:*?"<>|]/g, "");
        // userId별 prefix 추천(정리/삭제 관리 쉬움) — protect 후 req.user.id 사용 가능
        const prefix = req.user?.id || "public";
        const key = `${prefix}/${ts}-${safe}`;

        const uploadUrl = await presignPut(key, contentType, 300);
        const publicBase = process.env.S3_PUBLIC_BASE;
        const viewUrl = publicBase ? `${publicBase}/${encodeURI(key)}` : null;

        res.json({ key, uploadUrl, viewUrl });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

export default router;

